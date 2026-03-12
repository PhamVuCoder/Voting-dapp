import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xDc42de6B62f285029b1e0f4592A53aD1e6BD3Ea0";

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
      { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
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
        { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
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
const SEPOLIA_WSS      = `wss://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;
const SEPOLIA_RPC      = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`;

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask chưa được cài! Vào metamask.io để tải.");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
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
    } else throw switchError;
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
}

// WebSocket — lắng nghe events real-time
export function getContract() {
  const provider = new ethers.WebSocketProvider(SEPOLIA_WSS);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// HTTP — đọc data nhanh
export function getReadContract() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// MetaMask — ký transaction
export async function getSignedContract() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}