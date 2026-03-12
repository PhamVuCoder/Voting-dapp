import { useState, useEffect, useCallback } from "react";
import { connectWallet, getSignedContract, getContract } from "./utils/contract";
import "./App.css";

// ── Emoji cho từng ứng viên ──────────────────────────────
const CANDIDATE_EMOJIS = ["🔵", "🔴", "🟢", "🟡", "🟣"];

function App() {
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [votingId, setVotingId] = useState(null); // id đang được vote
  const [message, setMessage] = useState({ text: "", type: "" });
  const [txHash, setTxHash] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // ── Load tất cả candidates từ blockchain ────────────────
  const loadCandidates = useCallback(async () => {
    try {
      const contract = getContract();
      // Dùng getAllCandidates() — 1 lần gọi duy nhất, rất tiện!
      const raw = await contract.getAllCandidates();
      const list = raw.map((c) => ({
        id: Number(c.id),
        name: c.name,
        votes: Number(c.voteCount),
      }));
      setCandidates(list);
    } catch (err) {
      console.error("Lỗi load candidates:", err);
      setMessage({ text: "⚠️ Không load được dữ liệu từ blockchain.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Kiểm tra đã vote chưa ───────────────────────────────
  const checkVoted = useCallback(async (addr) => {
    try {
      const contract = getContract();
      const voted = await contract.hasVoted(addr);
      setHasVoted(voted);
    } catch (err) {
      console.error("Lỗi check voted:", err);
    }
  }, []);

  // ── Kết nối MetaMask ────────────────────────────────────
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

  // ── Bỏ phiếu ───────────────────────────────────────────
  const handleVote = async (candidateId) => {
    if (!account) {
      setMessage({ text: "⚠️ Hãy kết nối ví trước!", type: "warn" });
      return;
    }
    setIsVoting(true);
    setVotingId(candidateId);
    setMessage({ text: "⏳ Đang gửi transaction lên blockchain...", type: "info" });

    try {
      const contract = await getSignedContract();
      const tx = await contract.vote(candidateId);
      setMessage({ text: "⛓️ Đang chờ xác nhận trên Sepolia (~15 giây)...", type: "info" });
      await tx.wait(); // chờ được mine
      setTxHash(tx.hash);
      setHasVoted(true);
      setMessage({ text: "🎉 Bỏ phiếu thành công! Cảm ơn bạn đã tham gia.", type: "success" });
      await loadCandidates(); // Refresh số phiếu
    } catch (err) {
      if (err.code === "ACTION_REJECTED") {
        setMessage({ text: "❌ Bạn đã hủy transaction trong MetaMask.", type: "error" });
      } else if (err.message?.includes("Ban da bo phieu roi") || err.reason?.includes("Ban da bo phieu roi")) {
        setMessage({ text: "❌ Bạn đã bỏ phiếu rồi!", type: "error" });
        setHasVoted(true);
      } else {
        setMessage({ text: "❌ Lỗi: " + (err.reason || err.shortMessage || err.message), type: "error" });
      }
    } finally {
      setIsVoting(false);
      setVotingId(null);
    }
  };

  // ── Init: load candidates + lắng nghe đổi account ──────
  useEffect(() => {
    loadCandidates();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setHasVoted(false);
        } else {
          setAccount(accounts[0]);
          await checkVoted(accounts[0]);
        }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, [loadCandidates, checkVoted]);

  // ── Tính toán cho progress bar ──────────────────────────
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────── */}
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
              <span className="wallet-addr">
                {account.slice(0, 6)}…{account.slice(-4)}
              </span>
            </div>
          ) : (
            <button className="btn-connect" onClick={handleConnect}>
              🦊 Kết nối MetaMask
            </button>
          )}
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────── */}
      <main className="main">
        <div className="intro">
          <h2>Bỏ phiếu bầu cử</h2>
          <p>Mỗi địa chỉ ví chỉ được bỏ 1 phiếu • Kết quả minh bạch trên blockchain</p>
          {totalVotes > 0 && (
            <p className="total-votes">Tổng cộng: <strong>{totalVotes} phiếu</strong></p>
          )}
        </div>

        {/* ── Trạng thái loading ──────────────────────── */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải dữ liệu từ blockchain...</p>
          </div>
        ) : (
          <>
            {/* ── Banner đã vote ───────────────────────── */}
            {hasVoted && (
              <div className="voted-banner">
                ✅ Bạn đã bỏ phiếu! Cảm ơn bạn đã tham gia.
              </div>
            )}

            {/* ── Grid ứng viên ────────────────────────── */}
            <div className="candidates-grid">
              {candidates.map((c, i) => {
                const pct = totalVotes > 0
                  ? ((c.votes / totalVotes) * 100).toFixed(1)
                  : 0;
                const isWinning = totalVotes > 0 && c.votes === Math.max(...candidates.map(x => x.votes)) && c.votes > 0;
                const isThisVoting = isVoting && votingId === c.id;

                return (
                  <div key={c.id} className={`card ${isWinning ? "card--winning" : ""}`}>
                    {isWinning && <div className="winning-badge">👑 Đang dẫn đầu</div>}

                    <div className="card-emoji">{CANDIDATE_EMOJIS[i] || "🔵"}</div>
                    <h3 className="card-name">{c.name}</h3>

                    <div className="vote-stats">
                      <span className="vote-count">{c.votes} phiếu</span>
                      <span className="vote-pct">{pct}%</span>
                    </div>

                    <div className="progress-wrap">
                      <div
                        className="progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Nút bỏ phiếu — chỉ hiện khi đã login và chưa vote */}
                    {account && !hasVoted && (
                      <button
                        className={`btn-vote ${isThisVoting ? "btn-vote--loading" : ""}`}
                        onClick={() => handleVote(c.id)}
                        disabled={isVoting}
                      >
                        {isThisVoting ? (
                          <><span className="btn-spinner" /> Đang xử lý...</>
                        ) : (
                          "🗳 Bỏ phiếu"
                        )}
                      </button>
                    )}

                    {/* Gợi ý khi chưa connect */}
                    {!account && (
                      <p className="card-hint">Kết nối ví để bỏ phiếu</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Thông báo ───────────────────────────────── */}
        {message.text && (
          <div className={`message message--${message.type}`}>
            {message.text}
          </div>
        )}

        {/* ── Link Etherscan ───────────────────────────── */}
        {txHash && (
          <a
            className="etherscan-link"
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            🔍 Xem transaction trên Etherscan ↗
          </a>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="footer">
        Contract:{" "}
        <a
          href={`https://sepolia.etherscan.io/address/0x81778A172ee9D23ae22f6BE381ce9670b1BB4E86`}
          target="_blank"
          rel="noreferrer"
        >
          0x81778A…4E86 ↗
        </a>
      </footer>
    </div>
  );
}

export default App;