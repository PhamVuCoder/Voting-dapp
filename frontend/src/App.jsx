import { useState, useEffect, useCallback, useRef } from "react";
import { connectWallet, getSignedContract, getContract, getReadContract } from "./utils/contract";
import "./App.css";

const CANDIDATE_EMOJIS = ["🔵", "🔴", "🟢", "🟡", "🟣"];

function formatTimeLeft(seconds) {
  if (seconds <= 0) return "Đã kết thúc";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const hms = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return d > 0 ? `${d} ngày ${hms}` : hms;
}

function App() {
  const [account, setAccount]       = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted]     = useState(false);
  const [isVoting, setIsVoting]     = useState(false);
  const [votingId, setVotingId]     = useState(null);
  const [message, setMessage]       = useState({ text: "", type: "" });
  const [txHash, setTxHash]         = useState("");
  const [isLoading, setIsLoading]   = useState(true);
  const [newVoteId, setNewVoteId]   = useState(null);
  const [electionActive, setElectionActive] = useState(false);
  const [timeLeft, setTimeLeft]     = useState(0);
  const timerRef = useRef(null);

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
      setMessage({ text: "⚠️ Không load được dữ liệu từ blockchain.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // ── Connect wallet ──────────────────────────────────────
  const handleConnect = async () => {
    setMessage({ text: "", type: "" });
    try {
      const addr = await connectWallet();
      setAccount(addr);
      await checkVoted(addr);
    } catch (err) {
      setMessage({ text: "❌ " + err.message, type: "error" });
    }
  };

  // ── Vote ────────────────────────────────────────────────
  const handleVote = async (candidateId) => {
    if (!account) { setMessage({ text: "⚠️ Hãy kết nối ví trước!", type: "warn" }); return; }
    setIsVoting(true); setVotingId(candidateId);
    setMessage({ text: "⏳ Đang gửi transaction...", type: "info" });
    try {
      const contract = await getSignedContract();
      const tx = await contract.vote(candidateId);
      setMessage({ text: "⛓️ Chờ xác nhận trên Sepolia...", type: "info" });
      await tx.wait();
      setTxHash(tx.hash);
      setHasVoted(true);
      setMessage({ text: "🎉 Bỏ phiếu thành công!", type: "success" });
      await loadAll();
    } catch (err) {
      if (err.code === "ACTION_REJECTED") {
        setMessage({ text: "❌ Đã hủy transaction.", type: "error" });
      } else {
        setMessage({ text: "❌ " + (err.reason || err.shortMessage || err.message), type: "error" });
      }
    } finally { setIsVoting(false); setVotingId(null); }
  };

  // ── Init + realtime ─────────────────────────────────────
  useEffect(() => {
    loadAll();
    const ws = getContract();
    ws.on("Voted", (voter, candidateId) => {
      loadAll();
      setNewVoteId(Number(candidateId));
      setTimeout(() => setNewVoteId(null), 2000);
    });
    ws.on("ElectionStarted", () => loadAll());
    ws.on("ElectionEnded",   () => loadAll());
    ws.on("CandidateAdded",  () => loadAll());
    ws.on("CandidateHidden", () => loadAll());
    ws.on("CandidateShown",  () => loadAll());

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (!accounts.length) { setAccount(null); setHasVoted(false); }
        else { setAccount(accounts[0]); await checkVoted(accounts[0]); }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => ws.removeAllListeners();
  }, [loadAll, checkVoted]);

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⛓️</span>
            <div>
              <h1>Blockchain Voting</h1>
              <p className="network-badge">🟢 Sepolia Testnet</p>
            </div>
          </div>
          {account ? (
            <div className="wallet-connected">
              <span className="pulse-dot" />
              {account.slice(0,6)}…{account.slice(-4)}
            </div>
          ) : (
            <button className="btn-connect" onClick={handleConnect}>
              🦊 Kết nối MetaMask
            </button>
          )}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="main">
        <div className="intro">
          <h2>Bỏ phiếu bầu cử</h2>
          <p>Mỗi địa chỉ ví chỉ được bỏ 1 phiếu • Kết quả minh bạch trên blockchain</p>

          {electionActive && timeLeft > 0 && (
            <div className="countdown">
              <span className="countdown-label">⏰ Còn lại</span>
              <span className="countdown-time">{formatTimeLeft(timeLeft)}</span>
            </div>
          )}
          {!electionActive && !isLoading && (
            <div className="election-closed">🔒 Bầu cử chưa bắt đầu hoặc đã kết thúc</div>
          )}
          {totalVotes > 0 && (
            <p className="total-votes">Tổng cộng: <strong>{totalVotes} phiếu</strong></p>
          )}
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải dữ liệu từ blockchain...</p>
          </div>
        ) : (
          <>
            {hasVoted && (
              <div className="voted-banner">✅ Bạn đã bỏ phiếu! Cảm ơn bạn đã tham gia.</div>
            )}
            <div className="candidates-grid">
              {candidates.map((c, i) => {
                const pct        = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
                const isWinning  = totalVotes > 0 && c.votes === Math.max(...candidates.map(x => x.votes)) && c.votes > 0;
                const isFlashing = newVoteId === c.id;
                return (
                  <div key={c.id} className={["card", isWinning ? "card--winning" : "", isFlashing ? "card--flash" : ""].join(" ")}>
                    {isWinning  && <div className="winning-badge">👑 Đang dẫn đầu</div>}
                    {isFlashing && <div className="new-vote-badge">⚡ Vừa có phiếu mới!</div>}
                    <div className="card-emoji">{CANDIDATE_EMOJIS[i] || "🔵"}</div>
                    <h3 className="card-name">{c.name}</h3>
                    <div className="vote-stats">
                      <span className="vote-count">{c.votes} phiếu</span>
                      <span className="vote-pct">{pct}%</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-bar" style={{ width: `${pct}%` }} />
                    </div>
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
                    {!account && <p className="card-hint">Kết nối ví để bỏ phiếu</p>}
                    {account && !electionActive && !hasVoted && (
                      <p className="card-hint">Bầu cử chưa mở</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {message.text && (
          <div className={`message message--${message.type}`}>{message.text}</div>
        )}
        {txHash && (
          <a className="etherscan-link" href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
            🔍 Xem transaction trên Etherscan ↗
          </a>
        )}
      </main>

      <footer className="footer">
        Contract:{" "}
        <a href={`https://sepolia.etherscan.io/address/0xF74f589db0A5f832204Ee45b1AE5436D030D96a2`} target="_blank" rel="noreferrer">
          0xF74f…a2 ↗
        </a>
        {" · "}
        <a href="https://voting-dapp-adir.vercel.app" target="_blank" rel="noreferrer">
          ⚙️ Admin ↗
        </a>
      </footer>
    </div>
  );
}

export default App;