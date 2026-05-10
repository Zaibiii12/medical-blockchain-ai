import hre from "hardhat";

async function main() {
  // Get the account we are deploying from
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Compile and deploy the contract
  const MedicalRecords = await hre.ethers.getContractFactory("MedicalRecords");
  const medicalRecords = await MedicalRecords.deploy();

  // Wait for the deployment to finish
  await medicalRecords.waitForDeployment();

  // Fetch the deployed address
  const contractAddress = await medicalRecords.getAddress();
  
  console.log("------------------------------------------------");
  console.log("✅ MedicalRecords deployed to:", contractAddress);
  console.log("👑 Admin Account (Deployer):", deployer.address);
  console.log("------------------------------------------------");
  console.log("Action Required: Copy the deployed address above and update src/contracts/address.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});