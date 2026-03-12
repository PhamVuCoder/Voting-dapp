const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("Voting v2 — Admin + Deadline", function () {
  let voting, owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    // Lúc này có 3 ứng viên mặc định, isActive = false
  });

  // ── Khởi tạo ────────────────────────────────────────
  it("1. Owner đúng", async () => {
    expect(await voting.owner()).to.equal(owner.address);
  });

  it("2. Mặc định chưa mở bầu cử", async () => {
    expect(await voting.isActive()).to.equal(false);
  });

  it("3. Có 3 ứng viên mặc định", async () => {
    expect(await voting.candidatesCount()).to.equal(3);
  });

  // ── Admin: thêm ứng viên ───────────────────────────
  it("4. Thêm ứng viên trước khi start", async () => {
    await voting.addCandidate("Ung vien D");
    expect(await voting.candidatesCount()).to.equal(4);
  });

  it("5. Người khác không thêm được ứng viên", async () => {
    await expect(voting.connect(addr1).addCandidate("Hack"))
      .to.be.revertedWith("Chi chu so huu moi duoc goi");
  });

  // ── Admin: startElection ───────────────────────────
  it("6. Start bầu cử thành công", async () => {
    await voting.startElection(3600);
    expect(await voting.isActive()).to.equal(true);
  });

  it("7. Không thêm ứng viên khi đang bầu cử", async () => {
    await voting.startElection(3600);
    await expect(voting.addCandidate("Ung vien D"))
      .to.be.revertedWith("Khong the them ung vien khi dang bau cu");
  });

  it("8. Không vote khi chưa start", async () => {
    await expect(voting.connect(addr1).vote(1))
      .to.be.revertedWith("Bau cu chua bat dau hoac da ket thuc");
  });

  // ── Vote ────────────────────────────────────────────
  it("9. Vote thành công sau khi start", async () => {
    await voting.startElection(3600);
    await voting.connect(addr1).vote(1);
    const c = await voting.candidates(1);
    expect(c.voteCount).to.equal(1);
  });

  it("10. Không vote 2 lần", async () => {
    await voting.startElection(3600);
    await voting.connect(addr1).vote(1);
    await expect(voting.connect(addr1).vote(1))
      .to.be.revertedWith("Ban da bo phieu roi!");
  });

  it("11. Ứng viên không hợp lệ", async () => {
    await voting.startElection(3600);
    await expect(voting.connect(addr1).vote(99))
      .to.be.revertedWith("Ung vien khong hop le");
  });

  // ── Admin: endElection ─────────────────────────────
  it("12. Admin kết thúc sớm", async () => {
    await voting.startElection(3600);
    await voting.endElection();
    expect(await voting.isActive()).to.equal(false);
  });

  it("13. Không vote sau khi kết thúc", async () => {
    await voting.startElection(3600);
    await voting.endElection();
    await expect(voting.connect(addr1).vote(1))
      .to.be.revertedWith("Bau cu chua bat dau hoac da ket thuc");
  });

  // ── getElectionInfo ────────────────────────────────
  it("14. getElectionInfo trả về đúng khi đang chạy", async () => {
    await voting.startElection(3600);
    const info = await voting.getElectionInfo();
    expect(info._isActive).to.equal(true);
    expect(info._timeLeft).to.be.gt(0);
    expect(info._totalVotes).to.equal(0);
  });

  it("15. getElectionInfo timeLeft = 0 sau khi end", async () => {
    await voting.startElection(3600);
    await voting.endElection();
    const info = await voting.getElectionInfo();
    expect(info._isActive).to.equal(false);
    expect(info._timeLeft).to.equal(0);
  });
});