import hre from "hardhat";

async function main() {

    const { ethers } = hre;

    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");

    const medicalRecords = await MedicalRecords.deploy();

    await medicalRecords.waitForDeployment();

    console.log(
        "MedicalRecords deployed to:",
        await medicalRecords.getAddress()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});