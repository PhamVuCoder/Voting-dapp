const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting, owner, voter1, voter2;

  // Chạy trước mỗi test — deploy contract mới
  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
  });

  // TEST 1
  it("Nên có 3 ứng viên ban đầu", async function () {
    const count = await voting.candidatesCount();
    expect(count).to.equal(3);
  });

  // TEST 2
  it("Ứng viên đầu tiên tên là Ung vien A", async function () {
    const candidate = await voting.candidates(1);
    expect(candidate.name).to.equal("Ung vien A");
    expect(candidate.voteCount).to.equal(0);
  });

  // TEST 3
  it("Bỏ phiếu thành công", async function () {
    await voting.connect(voter1).vote(1);
    const candidate = await voting.candidates(1);
    expect(candidate.voteCount).to.equal(1);
  });

  // TEST 4
  it("Không thể bỏ phiếu 2 lần", async function () {
    await voting.connect(voter1).vote(1);
    await expect(
      voting.connect(voter1).vote(2)
    ).to.be.revertedWith("Ban da bo phieu roi!");
  });

  // TEST 5
  it("Không thể bỏ phiếu cho ứng viên không tồn tại", async function () {
    await expect(
      voting.connect(voter1).vote(99)
    ).to.be.revertedWith("Ung vien khong hop le");
  });

  // TEST 6
  it("Chỉ owner mới thêm được ứng viên", async function () {
    await expect(
      voting.connect(voter1).addCandidate("Ung vien D")
    ).to.be.revertedWith("Chi chu so huu moi duoc goi");
  });

  // TEST 7
  it("getAllCandidates trả về đúng danh sách", async function () {
    const all = await voting.getAllCandidates();
    expect(all.length).to.equal(3);
    expect(all[0].name).to.equal("Ung vien A");
    expect(all[2].name).to.equal("Ung vien C");
  });
});