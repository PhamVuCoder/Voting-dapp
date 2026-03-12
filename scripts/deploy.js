const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Voting v2...");

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("✅ Contract deployed:", address);

  // Bắt đầu bầu cử 7 ngày
  console.log("⏰ Bắt đầu bầu cử 7 ngày...");
  const tx = await voting.startElection(7 * 24 * 3600);
  await tx.wait();

  console.log("🎉 Xong!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 CONTRACT_ADDRESS =", address);
  console.log("👉 Cập nhật vào: frontend/src/utils/contract.js");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(console.error);