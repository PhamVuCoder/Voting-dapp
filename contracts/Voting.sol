// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Voting {
    // Struct đại diện cho một ứng viên
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Lưu trữ dữ liệu
    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint public candidatesCount;
    address public owner;

    // Events để frontend lắng nghe
    event Voted(address indexed voter, uint indexed candidateId);
    event CandidateAdded(uint id, string name);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Chi chu so huu moi duoc goi");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Thêm ứng viên mặc định
        addCandidate("Ung vien A");
        addCandidate("Ung vien B");
        addCandidate("Ung vien C");
    }

    // Thêm ứng viên (chỉ owner)
    function addCandidate(string memory _name) public onlyOwner {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(
            candidatesCount, _name, 0
        );
        emit CandidateAdded(candidatesCount, _name);
    }

    // Bỏ phiếu
    function vote(uint _candidateId) public {
        require(!hasVoted[msg.sender], "Ban da bo phieu roi!");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Ung vien khong hop le"
        );

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }

    // Lấy danh sách tất cả ứng viên
    function getAllCandidates()
        public view returns (Candidate[] memory)
    {
        Candidate[] memory result = new Candidate[](candidatesCount);
        for (uint i = 1; i <= candidatesCount; i++) {
            result[i - 1] = candidates[i];
        }
        return result;
    }
}