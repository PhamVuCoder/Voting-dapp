// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool)   public hasVoted;
    uint    public candidatesCount;
    address public owner;
    uint    public deadline;
    bool    public isActive;

    event Voted(address indexed voter, uint indexed candidateId);
    event CandidateAdded(uint id, string name);
    event ElectionStarted(uint deadline);
    event ElectionEnded();

    modifier onlyOwner() {
        require(msg.sender == owner, "Chi chu so huu moi duoc goi");
        _;
    }

    modifier electionOpen() {
        require(isActive, "Bau cu chua bat dau hoac da ket thuc");
        require(block.timestamp < deadline, "Da het thoi gian bau cu");
        _;
    }

    constructor() {
        owner    = msg.sender;
        isActive = false;
        _addCandidate("Ung vien A");
        _addCandidate("Ung vien B");
        _addCandidate("Ung vien C");
    }

    function _addCandidate(string memory _name) internal {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function addCandidate(string memory _name) public onlyOwner {
        require(!isActive, "Khong the them ung vien khi dang bau cu");
        _addCandidate(_name);
    }

    function startElection(uint _durationSeconds) public onlyOwner {
        require(candidatesCount > 0, "Chua co ung vien nao");
        require(!isActive, "Bau cu dang chay roi");
        require(_durationSeconds > 0, "Thoi gian phai lon hon 0");
        deadline = block.timestamp + _durationSeconds;
        isActive = true;
        emit ElectionStarted(deadline);
    }

    function endElection() public onlyOwner {
        require(isActive, "Bau cu chua bat dau");
        isActive = false;
        emit ElectionEnded();
    }

    function vote(uint _candidateId) public electionOpen {
        require(!hasVoted[msg.sender], "Ban da bo phieu roi!");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Ung vien khong hop le");
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        emit Voted(msg.sender, _candidateId);
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory result = new Candidate[](candidatesCount);
        for (uint i = 1; i <= candidatesCount; i++) {
            result[i - 1] = candidates[i];
        }
        return result;
    }

    function getElectionInfo() public view returns (
        bool _isActive, uint _deadline, uint _timeLeft, uint _totalVotes
    ) {
        _isActive = isActive;
        _deadline = deadline;
        _timeLeft = (isActive && block.timestamp < deadline) ? deadline - block.timestamp : 0;
        uint total = 0;
        for (uint i = 1; i <= candidatesCount; i++) { total += candidates[i].voteCount; }
        _totalVotes = total;
    }
}