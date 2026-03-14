import { useState, useEffect, useCallback } from "react";
import { connectWallet, getReadContract, getSignedContract, CONTRACT_ADDRESS, SEPOLIA_RPC } from "./utils/contract.js";
import { ethers } from "ethers";
import "./App.css";

function formatTimeLeft(s) {
  if (s <= 0) return "Đã kết thúc";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const hms = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return d > 0 ? `${d} ngày ${hms}` : hms;
}

function formatAddress(addr) {
  return addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : "";
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(Number(ts) * 1000).toLocaleString("vi-VN");
}

export default function App() {
  const [account, setAccount]         = useState(null);
  const [isOwner, setIsOwner]         = useState(false);
  const [candidates, setCandidates]   = useState([]);
  const [electionInfo, setElectionInfo] = useState(null);
  const [txHistory, setTxHistory]     = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [msg, setMsg]                 = useState({ text: "", type: "" });
  const [busy, setBusy]               = useState(false);
  const [newName, setNewName]         = useState("");
  const [duration, setDuration]       = useState(7);
  const [timeLeft, setTimeLeft]       = useState(0);
  const [activeTab, setActiveTab]     = useState("dashboard");

  // ── Load data ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const c = getReadContract();
      const [all, info] = await Promise.all([
        c.getAllCandidates(),
        c.getElectionInfo(),
      ]);
      setCandidates(all.map(x => ({
        id: Number(x.id), name: x.name,
        votes: Number(x.voteCount), isHidden: x.isHidden,
      })));
      setElectionInfo({
        isActive:   info._isActive,
        deadline:   Number(info._deadline),
        timeLeft:   Number(info._timeLeft),
        totalVotes: Number(info._totalVotes),
      });
      setTimeLeft(Number(info._timeLeft));
    } catch (e) {
      setMsg({ text: "⚠️ Lỗi tải dữ liệu: " + e.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Load tx history ────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const latest = await provider.getBlockNumber();
      const from = Math.max(0, latest - 5000);
      const c = getReadContract();

      const [votedLogs, addedLogs, startedLogs, endedLogs] = await Promise.all([
        c.queryFilter(c.filters.Voted(),            from, latest),
        c.queryFilter(c.filters.CandidateAdded(),   from, latest),
        c.queryFilter(c.filters.ElectionStarted(),  from, latest),
        c.queryFilter(c.filters.ElectionEnded(),    from, latest),
      ]);

      const all = [
        ...votedLogs.map(l => ({
          type: "Vote", txHash: l.transactionHash,
          block: l.blockNumber,
          detail: `${formatAddress(l.args.voter)} → Ứng viên #${l.args.candidateId}`,
        })),
        ...addedLogs.map(l => ({
          type: "Thêm ứng viên", txHash: l.transactionHash,
          block: l.blockNumber,
          detail: `"${l.args.name}"`,
        })),
        ...startedLogs.map(l => ({
          type: "Bắt đầu bầu cử", txHash: l.transactionHash,
          block: l.blockNumber,
          detail: `Deadline: ${formatDate(l.args.deadline)}`,
        })),
        ...endedLogs.map(l => ({
          type: "Kết thúc", txHash: l.transactionHash,
          block: l.blockNumber, detail: "",
        })),
      ].sort((a, b) => b.block - a.block);

      setTxHistory(all);
    } catch (e) {
      console.error("loadHistory:", e);
    }
  }, []);

  // ── Countdown ──────────────────────────────────────────
  useEffect(() => {
    if (!electionInfo?.isActive || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [electionInfo?.isActive, timeLeft]);

  // ── Connect ────────────────────────────────────────────
  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAccount(addr);
      const c = getReadContract();
      const owner = await c.owner();
      setIsOwner(owner.toLowerCase() === addr.toLowerCase());
    } catch (e) {
      setMsg({ text: "❌ " + e.message, type: "error" });
    }
  };

  // ── Admin actions ──────────────────────────────────────
  const action = async (fn, successMsg) => {
    setBusy(true); setMsg({ text: "⏳ Đang xử lý...", type: "info" });
    try {
      const c = await getSignedContract();
      const tx = await fn(c);
      await tx.wait();
      setMsg({ text: "✅ " + successMsg, type: "success" });
      await loadData();
      await loadHistory();
    } catch (e) {
      setMsg({ text: "❌ " + (e.reason || e.message), type: "error" });
    } finally { setBusy(false); }
  };

  const handleAddCandidate   = () => action(c => c.addCandidate(newName.trim()), `Đã thêm "${newName}"!`).then(() => setNewName(""));
  const handleStartElection  = () => action(c => c.startElection(duration * 86400), `Bầu cử bắt đầu ${duration} ngày!`);
  const handleEndElection    = () => { if (window.confirm("Kết thúc bầu cử sớm?")) action(c => c.endElection(), "Đã kết thúc bầu cử!"); };
  const handleHide           = (id) => action(c => c.hideCandidate(id), `Đã ẩn ứng viên #${id}`);
  const handleShow           = (id) => action(c => c.showCandidate(id), `Đã hiện ứng viên #${id}`);

  useEffect(() => { loadData(); loadHistory(); }, [loadData, loadHistory]);

  const totalVotes    = candidates.reduce((s, c) => s + c.votes, 0);
  const hiddenCount   = candidates.filter(c => c.isHidden).length;
  const visibleCount  = candidates.filter(c => !c.isHidden).length;

  // ── Not owner ──────────────────────────────────────────
  if (!account) {
    return (
      <div className="gate">
        <div className="gate-box">
          <div className="gate-icon">🔐</div>
          <h1>Admin Panel</h1>
          <p>Chỉ dành cho owner của smart contract</p>
          <button className="btn-connect" onClick={handleConnect}>🦊 Kết nối MetaMask</button>
          <div className="gate-contract">
            Contract: <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">
              {formatAddress(CONTRACT_ADDRESS)} ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="gate">
        <div className="gate-box gate-box--denied">
          <div className="gate-icon">🚫</div>
          <h1>Truy cập bị từ chối</h1>
          <p>Ví <code>{formatAddress(account)}</code> không phải owner.</p>
          <button className="btn-connect" onClick={handleConnect}>Thử ví khác</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span>⚙️</span>
            <div>
              <h1>Admin Panel</h1>
              <p className="sub">Blockchain Voting • Sepolia</p>
            </div>
          </div>
          <div className="header-right">
            <a className="btn-user-site" href="https://voting-dapp-silk.vercel.app" target="_blank" rel="noreferrer">
              🌐 User Site ↗
            </a>
            <div className="wallet-pill">
              <span className="dot" />
              {formatAddress(account)}
              <span className="owner-badge">👑 Owner</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="tabs">
        {["dashboard", "candidates", "election", "history"].map(t => (
          <button
            key={t}
            className={`tab ${activeTab === t ? "tab--active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {{ dashboard: "📊 Dashboard", candidates: "👥 Ứng viên", election: "⏰ Bầu cử", history: "📜 Lịch sử" }[t]}
          </button>
        ))}
      </div>

      <main className="main">
        {isLoading ? (
          <div className="loading"><div className="spinner" /><p>Đang tải...</p></div>
        ) : (
          <>
            {/* ── Dashboard ────────────────────────────── */}
            {activeTab === "dashboard" && (
              <div className="section">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{candidates.length}</div>
                    <div className="stat-label">Tổng ứng viên</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{totalVotes}</div>
                    <div className="stat-label">Tổng phiếu</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value stat-value--green">{visibleCount}</div>
                    <div className="stat-label">Đang hiển thị</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value stat-value--red">{hiddenCount}</div>
                    <div className="stat-label">Đang ẩn</div>
                  </div>
                </div>

                {/* Election status */}
                <div className={`status-banner ${electionInfo?.isActive ? "status-banner--active" : "status-banner--inactive"}`}>
                  <div className="status-left">
                    <span className="status-dot" />
                    <div>
                      <strong>{electionInfo?.isActive ? "🟢 Bầu cử đang diễn ra" : "🔴 Bầu cử chưa mở / đã kết thúc"}</strong>
                      {electionInfo?.isActive && (
                        <p>Còn lại: <span className="countdown">{formatTimeLeft(timeLeft)}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                {totalVotes > 0 && (
                  <div className="chart-section">
                    <h3>📊 Kết quả hiện tại</h3>
                    {candidates.filter(c => !c.isHidden).map(c => {
                      const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
                      const isLeading = c.votes === Math.max(...candidates.map(x => x.votes)) && c.votes > 0;
                      return (
                        <div key={c.id} className="chart-row">
                          <div className="chart-name">
                            {isLeading && "👑 "}{c.name}
                          </div>
                          <div className="chart-bar-wrap">
                            <div className="chart-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="chart-stat">{c.votes} phiếu ({pct}%)</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Candidates ───────────────────────────── */}
            {activeTab === "candidates" && (
              <div className="section">
                {/* Thêm ứng viên */}
                {!electionInfo?.isActive && (
                  <div className="panel">
                    <h3>➕ Thêm ứng viên mới</h3>
                    <div className="input-row">
                      <input
                        className="input" placeholder="Tên ứng viên..."
                        value={newName} onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && newName.trim() && handleAddCandidate()}
                      />
                      <button className="btn btn--primary" onClick={handleAddCandidate} disabled={busy || !newName.trim()}>
                        Thêm
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách */}
                <div className="panel">
                  <h3>👥 Danh sách ứng viên ({candidates.length})</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tên</th>
                        <th>Phiếu</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map(c => (
                        <tr key={c.id} className={c.isHidden ? "row--hidden" : ""}>
                          <td>{c.id}</td>
                          <td>{c.name}</td>
                          <td><strong>{c.votes}</strong></td>
                          <td>
                            <span className={`badge ${c.isHidden ? "badge--hidden" : "badge--visible"}`}>
                              {c.isHidden ? "🚫 Ẩn" : "✅ Hiển thị"}
                            </span>
                          </td>
                          <td>
                            {c.isHidden
                              ? <button className="btn btn--sm btn--green" onClick={() => handleShow(c.id)} disabled={busy}>Hiện</button>
                              : <button className="btn btn--sm btn--red"   onClick={() => handleHide(c.id)} disabled={busy}>Ẩn</button>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Election ─────────────────────────────── */}
            {activeTab === "election" && (
              <div className="section">
                {!electionInfo?.isActive ? (
                  <div className="panel">
                    <h3>🚀 Bắt đầu bầu cử</h3>
                    <p className="panel-desc">Chọn thời gian và bắt đầu. Sau khi bắt đầu không thể thêm ứng viên.</p>
                    <div className="input-row">
                      <input
                        className="input input--short" type="number"
                        min="1" max="30" value={duration}
                        onChange={e => setDuration(Number(e.target.value))}
                      />
                      <span className="unit">ngày</span>
                      <button className="btn btn--primary" onClick={handleStartElection} disabled={busy || candidates.filter(c=>!c.isHidden).length === 0}>
                        🚀 Bắt đầu
                      </button>
                    </div>
                    {candidates.filter(c=>!c.isHidden).length === 0 && (
                      <p className="warn">⚠️ Cần ít nhất 1 ứng viên đang hiển thị!</p>
                    )}
                  </div>
                ) : (
                  <div className="panel">
                    <h3>⏰ Bầu cử đang diễn ra</h3>
                    <div className="election-info">
                      <div className="info-row">
                        <span>Thời gian còn lại</span>
                        <span className="countdown-big">{formatTimeLeft(timeLeft)}</span>
                      </div>
                      <div className="info-row">
                        <span>Kết thúc lúc</span>
                        <span>{formatDate(electionInfo.deadline)}</span>
                      </div>
                      <div className="info-row">
                        <span>Tổng phiếu</span>
                        <span><strong>{electionInfo.totalVotes}</strong></span>
                      </div>
                    </div>
                    <button className="btn btn--danger" onClick={handleEndElection} disabled={busy}>
                      🛑 Kết thúc sớm
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── History ──────────────────────────────── */}
            {activeTab === "history" && (
              <div className="section">
                <div className="panel">
                  <div className="panel-header">
                    <h3>📜 Lịch sử transaction ({txHistory.length})</h3>
                    <button className="btn btn--sm btn--ghost" onClick={loadHistory}>🔄 Refresh</button>
                  </div>
                  {txHistory.length === 0 ? (
                    <p className="empty">Chưa có transaction nào.</p>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Loại</th>
                          <th>Chi tiết</th>
                          <th>Block</th>
                          <th>Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txHistory.map((tx, i) => (
                          <tr key={i}>
                            <td><span className={`badge badge--${tx.type === "Vote" ? "vote" : "action"}`}>{tx.type}</span></td>
                            <td className="td-detail">{tx.detail}</td>
                            <td>{tx.block}</td>
                            <td>
                              <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noreferrer" className="tx-link">
                                {tx.txHash.slice(0,10)}...↗
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {msg.text && <div className={`msg msg--${msg.type}`}>{msg.text}</div>}
      </main>
    </div>
  );
}