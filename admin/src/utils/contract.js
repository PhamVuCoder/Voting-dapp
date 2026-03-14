import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xF74f589db0A5f832204Ee45b1AE5436D030D96a2";

export const CONTRACT_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" }
    ],
    "name": "CandidateAdded", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "CandidateHidden", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }],
    "name": "CandidateShown", "type": "event"
  },
  { "anonymous": false, "inputs": [], "name": "ElectionEnded", "type": "event" },
  {
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256" }],
    "name": "ElectionStarted", "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "candidateId", "type": "uint256" }
    ],
    "name": "Voted", "type": "event"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
    "name": "addCandidate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "candidates",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "voteCount", "type": "uint256" },
      { "internalType": "bool", "name": "isHidden", "type": "bool" }
    ],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "candidatesCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "deadline",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view", "type": "function"
  },
  { "inputs": [], "name": "endElection", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  {
    "inputs": [], "name": "getAllCandidates",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "uint256", "name": "voteCount", "type": "uint256" },
        { "internalType": "bool", "name": "isHidden", "type": "bool" }
      ],
      "internalType": "struct Voting.Candidate[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "getActiveCandidates",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "uint256", "name": "voteCount", "type": "uint256" },
        { "internalType": "bool", "name": "isHidden", "type": "bool" }
      ],
      "internalType": "struct Voting.Candidate[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "getElectionInfo",
    "outputs": [
      { "internalType": "bool",    "name": "_isActive",   "type": "bool"    },
      { "internalType": "uint256", "name": "_deadline",   "type": "uint256" },
      { "internalType": "uint256", "name": "_timeLeft",   "type": "uint256" },
      { "internalType": "uint256", "name": "_totalVotes", "type": "uint256" }
    ],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "hideCandidate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [], "name": "isActive",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [], "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "showCandidate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_durationSeconds", "type": "uint256" }],
    "name": "startElection", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }],
    "name": "vote", "outputs": [], "stateMutability": "nonpayable", "type": "function"
  }
];

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const ALCHEMY_KEY      = "rgMwviFT2aroOcmtf6s1a";
export const SEPOLIA_RPC = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;

export async function connectWallet() {
  if (!window.ethereum) throw new Error("Chưa cài MetaMask!");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: SEPOLIA_CHAIN_ID,
          chainName: "Sepolia Testnet",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        }],
      });
    } else throw e;
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
}

export function getReadContract() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function getSignedContract() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}