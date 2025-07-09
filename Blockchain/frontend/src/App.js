import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import Voting from "./Voting.json";
import Verifier from "./VerifierABI.json";
const VERIFIER_CONTRACT_ADDRESS = process.env.REACT_APP_VERIFIER_CONTRACT_ADDRESS;

const VOTING_CONTRACT_ADDRESS = process.env.REACT_APP_VOTING_CONTRACT_ADDRESS;

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [verifier, setVerifier] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [owner, setOwner] = useState("");
  const [newCandidate, setNewCandidate] = useState("");
  const [electionStarted, setElectionStarted] = useState(false);

  const [proofIndex, setProofIndex] = useState("");
  const [proofA, setProofA] = useState("");
  const [proofInput, setProofInput] = useState("");

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();

          if (network.chainId !== 31337n) {
            alert("Please switch MetaMask to the Hardhat Localhost 8545 network (Chain ID 31337)");
            return;
          }

          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);

          const signer = await provider.getSigner();
          const _voting = new ethers.Contract(VOTING_CONTRACT_ADDRESS, Voting.abi, signer);
          setContract(_voting);
          window.contract = _voting;

          const _verifier = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, Verifier.abi, signer);
          setVerifier(_verifier);

          const _owner = await _voting.owner();
          setOwner(_owner);

          const _electionStarted = await _voting.electionStarted();
          setElectionStarted(_electionStarted);

          const count = await _voting.getCandidateCount();
          const names = [];
          const voteCounts = [];

          for (let i = 0; i < count; i++) {
            const name = await _voting.getCandidate(i);
            const voteCount = await _voting.getVotes(i);
            names.push(name);
            voteCounts.push(voteCount.toString());
          }

          setCandidates(names);
          setVotes(voteCounts);

          const voted = await _voting.hasVoted(accounts[0]);
          setHasVoted(voted);
        } catch (error) {
          console.error("Connection error:", error);
          alert("Ensure MetaMask is connected to the correct network.");
        }
      } else {
        alert("MetaMask not detected.");
      }
    };

    loadBlockchainData();
  }, []);

  const vote = async (index) => {
    try {
      const tx = await contract.vote(index);
      await tx.wait();
      alert(`Voted for ${candidates[index]}`);
      setHasVoted(true);

      const updatedVotes = [...votes];
      const newCount = await contract.getVotes(index);
      updatedVotes[index] = newCount.toString();
      setVotes(updatedVotes);
    } catch (error) {
      console.error("Vote error:", error);
      alert("Voting failed. You may have already voted or election is not active.");
    }
  };

  const addCandidate = async () => {
    if (!newCandidate.trim()) return;

    try {
      const tx = await contract.addCandidate(newCandidate);
      await tx.wait();
      alert(`Candidate "${newCandidate}" added.`);
      setCandidates([...candidates, newCandidate]);
      setVotes([...votes, "0"]);
      setNewCandidate("");
    } catch (err) {
      console.error("Add candidate error:", err);
      alert("Only the owner can add candidates.");
    }
  };

  const removeCandidate = async (index) => {
    try {
      const tx = await contract.removeCandidate(index);
      await tx.wait();
      alert(`Candidate "${candidates[index]}" removed.`);
      const updatedCandidates = [...candidates];
      const updatedVotes = [...votes];
      updatedCandidates.splice(index, 1);
      updatedVotes.splice(index, 1);
      setCandidates(updatedCandidates);
      setVotes(updatedVotes);
    } catch (err) {
      console.error("Remove candidate error:", err);
      alert("Only the owner can remove candidates.");
    }
  };

  const startElection = async () => {
    try {
      const tx = await contract.startElection();
      await tx.wait();
      setElectionStarted(true);
      setVotes(votes.map(() => "0"));
      const voted = await contract.hasVoted(account);
      setHasVoted(voted);
    } catch (err) {
      alert("Only the owner can start the election.");
    }
  };

  const endElection = async () => {
    try {
      const tx = await contract.endElection();
      await tx.wait();
      setElectionStarted(false);
      setVotes(votes.map(() => "0"));
      const voted = await contract.hasVoted(account);
      setHasVoted(voted);
    } catch (err) {
      alert("Only the owner can end the election.");
    }
  };

  const restartElection = async () => {
    try {
      const tx = await contract.restartElection();
      await tx.wait();
      setElectionStarted(true);
      setVotes(votes.map(() => "0"));
      setHasVoted(false);
      alert("Election restarted.");
    } catch (err) {
      console.error("Restart error:", err);
      alert("Only the owner can restart the election.");
    }
  };

  const voteWithProof = async (index, proofBytes, publicInputs) => {
    try {
      const formattedInputs = publicInputs.map(i => ethers.toBigInt(i));
      const tx = await contract.voteWithProof(index, proofBytes, formattedInputs);
      await tx.wait();
      alert(`Proof-verified vote cast`);
      setHasVoted(true);
    } catch (err) {
      console.error("Proof voting failed:", err);
      alert("Invalid proof, already voted, or election not active. Check console for details.");
    }
  };

  const handleProofSubmit = async (e) => {
    e.preventDefault();
    try {
      const index = parseInt(proofIndex);

      // Parse the proof string assuming it's a hex string
      const proofHex = proofA.trim().replace(/^"(.*)"$/, '$1'); // remove surrounding quotes if present
      const proofBytes = ethers.getBytes(proofHex);

      // Parse public inputs
      const publicInputs = JSON.parse(proofInput).map((i) => BigInt(i));

      await voteWithProof(index, proofBytes, publicInputs);
    } catch (err) {
      alert("Invalid proof or public inputs.");
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <h2>Student Council Voting</h2>
      <p><strong>Account:</strong> {account}</p>
      <p><strong>Contract Owner:</strong> {owner}</p>
      <p><strong>Verifier Contract:</strong> {VERIFIER_CONTRACT_ADDRESS}</p>

      <p className="status">
        <strong>Election Status:</strong>{" "}
        <span className={electionStarted ? "live" : "ended"}>
          {electionStarted ? "Live" : "Not Started"}
        </span>
      </p>

      {account.toLowerCase() === owner.toLowerCase() && (
        <div className="admin-panel">
          <h4>Admin Panel</h4>
          <button onClick={startElection} disabled={electionStarted}>Start Election</button>
          <button onClick={endElection} disabled={!electionStarted}>End Election</button>
          <button onClick={restartElection}>Restart Election</button>

          <div className="add-candidate">
            <input
              value={newCandidate}
              onChange={(e) => setNewCandidate(e.target.value)}
              placeholder="New candidate name"
            />
            <button onClick={addCandidate}>Add Candidate</button>
          </div>
        </div>
      )}

      <h3>Candidates</h3>
      {candidates.length === 0 ? (
        <p>No candidates available.</p>
      ) : (
        candidates.map((name, index) => (
          <div key={index} className="candidate">
            <span>{name} — {votes[index]} votes</span>
            <button
              onClick={() => vote(index)}
              disabled={!electionStarted || hasVoted}
            >
              Vote
            </button>
            {account.toLowerCase() === owner.toLowerCase() && (
              <button className="remove" onClick={() => removeCandidate(index)}>Remove</button>
            )}
          </div>
        ))
      )}

      {hasVoted ? <p className="voted-msg">✅ You have already voted.</p> : null}

      <h3>Vote With ZK Proof</h3>
      <form onSubmit={handleProofSubmit} className="zk-form">
        <input
          type="number"
          placeholder="Candidate index"
          value={proofIndex}
          onChange={(e) => setProofIndex(e.target.value)}
          required
        />
        <textarea
          placeholder="Enter proof (hex string)"
          value={proofA}
          onChange={(e) => setProofA(e.target.value)}
          required
        />
        <textarea
          placeholder="Enter publicInputs as JSON array"
          value={proofInput}
          onChange={(e) => setProofInput(e.target.value)}
          required
        />
        <button type="submit">Submit ZK Vote</button>
      </form>

      <button onClick={async () => {
        if (contract && account) {
          const voted = await contract.hasVoted(account);
          alert("Voted? " + voted);
        }
      }}>
        Check if voted
      </button>
    </div>
  );
}

export default App;