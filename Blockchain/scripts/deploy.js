const hre = require("hardhat");

async function main() {
  const Verifier = await hre.ethers.getContractFactory("HonkVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  console.log("Verifier deployed to:", verifier.target);

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(verifier.target);
  await voting.waitForDeployment();
  console.log("Voting deployed to:", voting.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});