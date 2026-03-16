const { ethers } = require("hardhat");

async function main() {
  console.log("Đang deploy Voting contract...");

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log(`✅ Contract deployed tại: ${address}`);
  console.log("👉 Copy địa chỉ này để dùng ở frontend!");
}

main().catch(console.error);