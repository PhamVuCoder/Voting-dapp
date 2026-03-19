import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { connectWallet, getSignedContract, getContract, getReadContract } from "./utils/contract";
import "./App.css";

const CANDIDATE_EMOJIS = ["🔵", "🔴", "🟢", "🟡", "🟣", "🟠"];
const ENS_RPC = "https://eth-mainnet.g.alchemy.com/v2/rgMwviFT2aroOcmtf6s1a";

function formatTimeLeft(seconds) {
  if (seconds <= 0) return "Đã kết thúc";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const hms = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return d > 0 ? `${d} ngày ${hms}` : hms;
}

function shortAddr(addr) {
  return addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "";
}

// ── Toast System ────────────────────────────────────────
let toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((text, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, add, remove };
}

function ToastContainer({ toasts, remove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => remove(t.id)}>
          <span className="toast-icon">
            {{ info: "ℹ️", success: "✅", error: "❌", warn: "⚠️", vote: "⚡" }[t.type] || "ℹ️"}
          </span>
          <span className="toast-text">{t.text}</span>
          <button className="toast-close">×</button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [account, setAccount]         = useState(null);
  const [ens, setEns]                 = useState(null);
  const [candidates, setCandidates]   = useState([]);
  const [hasVoted, setHasVoted]       = useState(false);
  const [isVoting, setIsVoting]       = useState(false);
  const [votingId, setVotingId]       = useState(null);
  const [txHash, setTxHash]           = useState("");
  const [isLoading, setIsLoading]     = useState(true);
  const [newVoteId, setNewVoteId]     = useState(null);
  const [electionActive, setElectionActive] = useState(false);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [recentVoter, setRecentVoter] = useState(null);
  const timerRef = useRef(null);
  const { toasts, add: toast, remove: removeToast } = useToast();

  // ── ENS Lookup ──────────────────────────────────────────
  const lookupENS = useCallback(async (addr) => {
    try {
      const provider = new ethers.JsonRpcProvider(ENS_RPC);
      const name = await provider.lookupAddress(addr);
      setEns(name);
    } catch { setEns(null); }
  }, []);

  // ── Load data ───────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const contract = getReadContract();
      const [raw, info] = await Promise.all([
        contract.getActiveCandidates(),
        contract.getElectionInfo(),
      ]);
      setCandidates(raw.map(c => ({
        id: Number(c.id), name: c.name, votes: Number(c.voteCount),
      })));
      setElectionActive(info._isActive);
      setTimeLeft(Number(info._timeLeft));
    } catch (err) {
      console.error(err);
      toast("Không load được dữ liệu từ blockchain.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkVoted = useCallback(async (addr) => {
    try {
      const voted = await getReadContract().hasVoted(addr);
      setHasVoted(voted);
    } catch (err) { console.error(err); }
  }, []);

  // ── Countdown ───────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (electionActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setElectionActive(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [electionActive, timeLeft]);

  // ── Connect ─────────────────────────────────────────────
  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAccount(addr);
      await Promise.all([checkVoted(addr), lookupENS(addr)]);
      toast("Đã kết nối ví thành công!", "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  // ── Vote ────────────────────────────────────────────────
  const handleVote = async (candidateId) => {
    if (!account) { toast("Hãy kết nối ví trước!", "warn"); return; }
    setIsVoting(true); setVotingId(candidateId);
    toast("Đang gửi transaction...", "info", 10000);
    try {
      const contract = await getSignedContract();
      const tx = await contract.vote(candidateId);
      toast("Chờ xác nhận trên Sepolia...", "info", 20000);
      await tx.wait();
      setTxHash(tx.hash);
      setHasVoted(true);
      toast("Bỏ phiếu thành công! 🎉", "success", 6000);
      await loadAll();
    } catch (err) {
      if (err.code === "ACTION_REJECTED") {
        toast("Đã hủy transaction.", "warn");
      } else {
        toast(err.reason || err.shortMessage || err.message, "error");
      }
    } finally { setIsVoting(false); setVotingId(null); }
  };

  // ── Realtime ────────────────────────────────────────────
  useEffect(() => {
    loadAll();
    const ws = getContract();

    ws.on("Voted", async (voter, candidateId) => {
      await loadAll();
      setNewVoteId(Number(candidateId));
      // ENS lookup cho voter
      try {
        const provider = new ethers.JsonRpcProvider(ENS_RPC);
        const name = await provider.lookupAddress(voter);
        setRecentVoter(name || shortAddr(voter));
      } catch {
        setRecentVoter(shortAddr(voter));
      }
      setTimeout(() => { setNewVoteId(null); setRecentVoter(null); }, 3000);
      toast(`⚡ Phiếu mới cho ứng viên #${candidateId}!`, "vote", 3000);
    });

    ws.on("ElectionStarted", () => {
      loadAll();
      toast("🚀 Bầu cử đã bắt đầu!", "success", 5000);
    });
    ws.on("ElectionEnded", () => {
      loadAll();
      toast("🏁 Bầu cử đã kết thúc!", "info", 5000);
    });
    ws.on("CandidateAdded",  () => { loadAll(); toast("➕ Ứng viên mới được thêm!", "info"); });
    ws.on("CandidateHidden", () => loadAll());
    ws.on("CandidateShown",  () => loadAll());

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (!accounts.length) { setAccount(null); setHasVoted(false); setEns(null); }
        else {
          setAccount(accounts[0]);
          await Promise.all([checkVoted(accounts[0]), lookupENS(accounts[0])]);
        }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => ws.removeAllListeners();
  }, [loadAll, checkVoted, lookupENS, toast]);

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const maxVotes   = Math.max(...candidates.map(c => c.votes), 0);

  return (
    <div className="app">
      <ToastContainer toasts={toasts} remove={removeToast} />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon-wrap">⛓️</div>
            <div>
              <h1>Blockchain Voting</h1>
              <p className="network-badge">
                <span className="network-dot" />
                Sepolia Testnet
              </p>
            </div>
          </div>

          <div className="header-right">
            {account ? (
              <div className="wallet-pill">
                <span className="pulse-dot" />
                <div className="wallet-info">
                  {ens
                    ? <><span className="ens-name">{ens}</span><span className="ens-addr">{shortAddr(account)}</span></>
                    : <span>{shortAddr(account)}</span>
                  }
                </div>
              </div>
            ) : (
              <button className="btn-connect" onClick={handleConnect}>
                <span>🦊</span> Kết nối MetaMask
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <main className="main">
        <div className="hero">
          <div className="hero-badge">
            {electionActive ? "🟢 Đang diễn ra" : "🔴 Chưa mở"}
          </div>
          <h2>Bỏ phiếu bầu cử</h2>
          <p>Mỗi địa chỉ ví chỉ được bỏ 1 phiếu • Minh bạch trên blockchain</p>

          <div className="hero-stats">
            {electionActive && timeLeft > 0 && (
              <div className="stat-pill stat-pill--timer">
                <span>⏰</span>
                <span className="countdown-time">{formatTimeLeft(timeLeft)}</span>
              </div>
            )}
            {totalVotes > 0 && (
              <div className="stat-pill">
                <span>🗳</span>
                <span><strong>{totalVotes}</strong> phiếu</span>
              </div>
            )}
            {candidates.length > 0 && (
              <div className="stat-pill">
                <span>👥</span>
                <span><strong>{candidates.length}</strong> ứng viên</span>
              </div>
            )}
          </div>

          {!electionActive && !isLoading && (
            <div className="election-closed">🔒 Bầu cử chưa bắt đầu hoặc đã kết thúc</div>
          )}
        </div>

        {/* ── Voted Banner ─────────────────────────────── */}
        {hasVoted && (
          <div className="voted-banner">
            <span className="voted-icon">✅</span>
            <div>
              <strong>Bạn đã bỏ phiếu thành công!</strong>
              <p>Cảm ơn bạn đã tham gia bầu cử</p>
            </div>
            {txHash && (
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="voted-link">
                Xem Tx ↗
              </a>
            )}
          </div>
        )}

        {/* ── Candidates ───────────────────────────────── */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải dữ liệu từ blockchain...</p>
          </div>
        ) : (
          <div className="candidates-grid">
            {candidates.map((c, i) => {
              const pct        = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
              const isWinning  = c.votes === maxVotes && c.votes > 0;
              const isFlashing = newVoteId === c.id;
              return (
                <div key={c.id} className={[
                  "card",
                  isWinning  ? "card--winning"  : "",
                  isFlashing ? "card--flash"    : "",
                ].join(" ")}>

                  {isWinning && <div className="winning-badge">👑 Dẫn đầu</div>}

                  <div className="card-top">
                    <span className="card-emoji">{CANDIDATE_EMOJIS[i] || "🔵"}</span>
                    <span className="card-id">#{c.id}</span>
                  </div>

                  <h3 className="card-name">{c.name}</h3>

                  <div className="vote-stats">
                    <span className="vote-count">{c.votes}</span>
                    <span className="vote-label">phiếu</span>
                    <span className="vote-pct">{pct}%</span>
                  </div>

                  <div className="progress-wrap">
                    <div className="progress-bar" style={{ width: `${pct}%` }} />
                  </div>

                  {isFlashing && recentVoter && (
                    <div className="recent-voter">
                      ⚡ {recentVoter} vừa bỏ phiếu!
                    </div>
                  )}

                  {account && !hasVoted && electionActive && (
                    <button
                      className={`btn-vote ${isVoting && votingId === c.id ? "btn-vote--loading" : ""}`}
                      onClick={() => handleVote(c.id)}
                      disabled={isVoting}
                    >
                      {isVoting && votingId === c.id
                        ? <><span className="btn-spinner" /> Đang xử lý...</>
                        : "🗳 Bỏ phiếu"
                      }
                    </button>
                  )}
                  {!account && (
                    <button className="btn-vote btn-vote--ghost" onClick={handleConnect}>
                      🦊 Kết nối để vote
                    </button>
                  )}
                  {account && hasVoted && (
                    <div className="voted-tag">✅ Đã bỏ phiếu</div>
                  )}
                  {account && !electionActive && !hasVoted && (
                    <div className="closed-tag">🔒 Chưa mở</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <a href={`https://sepolia.etherscan.io/address/0xF74f589db0A5f832204Ee45b1AE5436D030D96a2`} target="_blank" rel="noreferrer">
            📋 Contract ↗
          </a>
          <span className="footer-dot">·</span>
          <a href="https://voting-dapp-adir.vercel.app" target="_blank" rel="noreferrer">
            ⚙️ Admin ↗
          </a>
          <span className="footer-dot">·</span>
          <span>Powered by Ethereum</span>
        </div>
      </footer>
    </div>
  );
}