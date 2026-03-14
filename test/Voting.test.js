const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("Voting v3 — Soft Delete", function () {
  let voting, owner, addr1, addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
  });

  it("1. Owner đúng", async () => {
    expect(await voting.owner()).to.equal(owner.address);
  });

  it("2. Mặc định chưa mở bầu cử", async () => {
    expect(await voting.isActive()).to.equal(false);
  });

  it("3. Có 3 ứng viên mặc định, tất cả isHidden = false", async () => {
    const all = await voting.getAllCandidates();
    expect(all.length).to.equal(3);
    all.forEach(c => expect(c.isHidden).to.equal(false));
  });

  it("4. Admin ẩn ứng viên thành công", async () => {
    await voting.hideCandidate(1);
    const c = await voting.candidates(1);
    expect(c.isHidden).to.equal(true);
  });

  it("5. Người khác không ẩn được ứng viên", async () => {
    await expect(voting.connect(addr1).hideCandidate(1))
      .to.be.revertedWith("Chi chu so huu moi duoc goi");
  });

  it("6. Không ẩn ứng viên đã ẩn rồi", async () => {
    await voting.hideCandidate(1);
    await expect(voting.hideCandidate(1))
      .to.be.revertedWith("Ung vien da duoc an roi");
  });

  it("7. Admin hiện lại ứng viên thành công", async () => {
    await voting.hideCandidate(1);
    await voting.showCandidate(1);
    const c = await voting.candidates(1);
    expect(c.isHidden).to.equal(false);
  });

  it("8. Không hiện ứng viên đang hiển thị rồi", async () => {
    await expect(voting.showCandidate(1))
      .to.be.revertedWith("Ung vien dang hien thi roi");
  });

  it("9. getActiveCandidates chỉ trả về ứng viên chưa ẩn", async () => {
    await voting.hideCandidate(1);
    const active = await voting.getActiveCandidates();
    expect(active.length).to.equal(2);
    active.forEach(c => expect(c.isHidden).to.equal(false));
  });

  it("10. getAllCandidates trả về TẤT CẢ kể cả đã ẩn", async () => {
    await voting.hideCandidate(1);
    const all = await voting.getAllCandidates();
    expect(all.length).to.equal(3);
  });

  it("11. Không vote được ứng viên đã ẩn", async () => {
    await voting.hideCandidate(1);
    await voting.startElection(3600);
    await expect(voting.connect(addr1).vote(1))
      .to.be.revertedWith("Ung vien nay da bi an");
  });

  it("12. Vote bình thường với ứng viên chưa ẩn", async () => {
    await voting.startElection(3600);
    await voting.connect(addr1).vote(2);
    const c = await voting.candidates(2);
    expect(c.voteCount).to.equal(1);
  });

  it("13. Start bầu cử thành công", async () => {
    await voting.startElection(3600);
    expect(await voting.isActive()).to.equal(true);
  });

  it("14. Không vote 2 lần", async () => {
    await voting.startElection(3600);
    await voting.connect(addr1).vote(1);
    await expect(voting.connect(addr1).vote(1))
      .to.be.revertedWith("Ban da bo phieu roi!");
  });

  it("15. Admin kết thúc sớm", async () => {
    await voting.startElection(3600);
    await voting.endElection();
    expect(await voting.isActive()).to.equal(false);
  });

  it("16. getElectionInfo totalVotes không tính ứng viên ẩn", async () => {
    await voting.startElection(3600);
    await voting.connect(addr1).vote(1);
    await voting.hideCandidate(1);
    const info = await voting.getElectionInfo();
    expect(info._totalVotes).to.equal(0);
  });
});