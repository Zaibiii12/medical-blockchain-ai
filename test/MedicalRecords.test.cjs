const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords Smart Contract QA", function () {
  let medicalRecords;
  let admin, patient, doctor, unauthorizedUser;

  beforeEach(async function () {
    // 1. Get fake testing accounts provided by Hardhat
    [admin, patient, doctor, unauthorizedUser] = await ethers.getSigners();

    // 2. Deploy a fresh copy of your contract before every single test
    const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
    medicalRecords = await MedicalRecords.deploy();

    // 3. Setup: The Admin assigns the DOCTOR_ROLE to our test 'doctor'
    await medicalRecords.connect(admin).addDoctor(doctor.address);

    // 4. Setup: The Doctor uploads a dummy medical record for the patient
    await medicalRecords.connect(doctor).uploadRecord(patient.address, "QmTestHash123", "Blood Test Results");
  });

  it("QA Negative Test: Reverts when an unauthorized user tries to view records", async function () {
    // Action: unauthorizedUser tries to read the patient's vault without permission.
    // Assertion: We expect the transaction to crash (revert) with your exact error message.
    await expect(
      medicalRecords.connect(unauthorizedUser).getPatientRecords(patient.address)
    ).to.be.revertedWith("Not authorized. Doctors must request access or trigger Emergency Override.");
  });

  it("QA Positive Test: Patient grants access and emits an audit event", async function () {
    // Action: Patient explicitly grants access to the doctor.
    // Assertion 1: Verify the blockchain logs the 'AccessGranted' event.
    await expect(medicalRecords.connect(patient).grantAccess(doctor.address))
      .to.emit(medicalRecords, "AccessGranted")
      .withArgs(patient.address, doctor.address);

    // Assertion 2: Verify the doctor can now successfully download the records.
    const records = await medicalRecords.connect(doctor).getPatientRecords(patient.address);
    expect(records.length).to.equal(1);
    expect(records[0].fileHash).to.equal("QmTestHash123");
  });

  it("QA Audit Test: Emergency Override forces access and emits a severe audit log", async function () {
    // Action: Doctor triggers the Emergency Override for the patient.
    // Assertion 1: Verify the 'EmergencyOverride' event is fired for the compliance audit trail.
    await expect(medicalRecords.connect(doctor).emergencyOverride(patient.address))
      .to.emit(medicalRecords, "EmergencyOverride");

    // Assertion 2: Verify the smart contract automatically added the doctor to the UI list
    // so the patient can see exactly who bypassed their vault.
    const authorizedList = await medicalRecords.connect(patient).getAuthorizedDoctors();
    expect(authorizedList).to.include(doctor.address);
  });
});