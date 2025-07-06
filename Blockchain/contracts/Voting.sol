// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { HonkVerifier } from "./Verifier.sol";

contract Voting {
    address public owner;
    bool public electionStarted;

    string[] public candidates;
    mapping(string => bool) private candidateExists;
    mapping(address => bool) public hasVoted;
    mapping(uint => uint) public votes;

    HonkVerifier public verifier;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyDuringElection() {
        require(electionStarted, "Election is not active");
        _;
    }

    constructor(address _verifier) {
        verifier = HonkVerifier(_verifier);
        owner = msg.sender;
        candidates.push("Naman");
        candidates.push("Akshay");
        candidates.push("Aditya");

        candidateExists["Naman"] = true;
        candidateExists["Akshay"] = true;
        candidateExists["Aditya"] = true;
    }

    function startElection() public onlyOwner {
        electionStarted = true;
    }

    function endElection() public onlyOwner {
        electionStarted = false;
    }

    function addCandidate(string memory name) public onlyOwner {
        require(!candidateExists[name], "Candidate already exists");
        candidates.push(name);
        candidateExists[name] = true;
    }

    function removeCandidate(uint index) public onlyOwner {
        require(index < candidates.length, "Invalid index");

        string memory nameToRemove = candidates[index];
        candidateExists[nameToRemove] = false;

        // Shift array elements to overwrite removed item
        for (uint i = index; i < candidates.length - 1; i++) {
            candidates[i] = candidates[i + 1];
        }
        candidates.pop();
    }

    function vote(uint index) public onlyDuringElection {
        require(!hasVoted[msg.sender], "You have already voted");
        require(index < candidates.length, "Invalid candidate");

        votes[index]++;
        hasVoted[msg.sender] = true;
    }

    function getVotes(uint index) public view returns (uint) {
        require(index < candidates.length, "Invalid candidate index");
        return votes[index];
    }

    function getCandidate(uint index) public view returns (string memory) {
        require(index < candidates.length, "Invalid candidate index");
        return candidates[index];
    }

    function getCandidateCount() public view returns (uint) {
        return candidates.length;
    }

    function voteWithProof(
        uint index,
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) public onlyDuringElection {
        require(!hasVoted[msg.sender], "You have already voted");
        require(index < candidates.length, "Invalid candidate");
        bytes32[] memory inputAsBytes32 = new bytes32[](publicInputs.length);
        for (uint i = 0; i < publicInputs.length; i++) {
            inputAsBytes32[i] = bytes32(publicInputs[i]);
        }
        require(verifier.verify(proof, inputAsBytes32), "Invalid ZK proof");

        votes[index]++;
        hasVoted[msg.sender] = true;
    }
}