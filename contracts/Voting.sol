// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // electionId => candidateId => Candidate
    mapping(uint => mapping(uint => Candidate)) public candidates;
    
    // electionId => address => đã vote chưa
    mapping(uint => mapping(address => bool)) public hasVoted;
    
    // electionId => số lượng ứng viên
    mapping(uint => uint) public candidatesCount;
    
    uint public currentElectionId;
    address public owner;

    event Voted(address indexed voter, uint indexed candidateId, uint electionId);
    event CandidateAdded(uint id, string name, uint electionId);
    event NewElectionStarted(uint electionId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Chi chu so huu moi duoc goi");
        _;
    }

    constructor() {
        owner = msg.sender;
        currentElectionId = 1;
        _addCandidate("Ung vien A");
        _addCandidate("Ung vien B");
        _addCandidate("Ung vien C");
    }

    // Bắt đầu cuộc bầu cử mới (chỉ owner)
    function startNewElection() public onlyOwner {
        currentElectionId++;
        emit NewElectionStarted(currentElectionId);
    }

    // Thêm ứng viên vào cuộc bầu cử hiện tại
    function addCandidate(string memory _name) public onlyOwner {
        _addCandidate(_name);
    }

    function _addCandidate(string memory _name) internal {
        uint eId = currentElectionId;
        candidatesCount[eId]++;
        uint cId = candidatesCount[eId];
        candidates[eId][cId] = Candidate(cId, _name, 0);
        emit CandidateAdded(cId, _name, eId);
    }

    // Bỏ phiếu trong cuộc bầu cử hiện tại
    function vote(uint _candidateId) public {
        uint eId = currentElectionId;
        require(!hasVoted[eId][msg.sender], "Ban da bo phieu roi!");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount[eId],
            "Ung vien khong hop le"
        );

        hasVoted[eId][msg.sender] = true;
        candidates[eId][_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId, eId);
    }

    // Lấy danh sách ứng viên cuộc bầu cử hiện tại
    function getAllCandidates()
        public view returns (Candidate[] memory)
    {
        uint eId = currentElectionId;
        uint count = candidatesCount[eId];
        Candidate[] memory result = new Candidate[](count);
        for (uint i = 1; i <= count; i++) {
            result[i - 1] = candidates[eId][i];
        }
        return result;
    }

    // Kiểm tra địa chỉ đã vote trong cuộc bầu cử hiện tại chưa
    function hasVotedCurrent(address _addr) public view returns (bool) {
        return hasVoted[currentElectionId][_addr];
    }
}