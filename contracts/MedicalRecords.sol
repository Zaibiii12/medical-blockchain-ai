// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MedicalRecords is AccessControl {
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");

    struct Record {
        string fileHash;
        string description;
        uint256 timestamp;
    }

    mapping(address => Record[]) private patientRecords;
    
    // Tracks which patient has authorized which doctor
    mapping(address => mapping(address => bool)) public isAuthorized;

    event RecordAdded(address indexed patient, string fileHash);
    event DoctorAdded(address indexed doctor);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addDoctor(address _doctor) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DOCTOR_ROLE, _doctor);
        emit DoctorAdded(_doctor);
    }

    function uploadRecord(address _patient, string memory _fileHash, string memory _description) public onlyRole(DOCTOR_ROLE) {
        patientRecords[_patient].push(Record(_fileHash, _description, block.timestamp));
        emit RecordAdded(_patient, _fileHash);
    }

    // --- PATIENT PERMISSIONS ---
    function grantAccess(address _doctor) public {
        isAuthorized[msg.sender][_doctor] = true;
        emit AccessGranted(msg.sender, _doctor);
    }

    function revokeAccess(address _doctor) public {
        isAuthorized[msg.sender][_doctor] = false;
        emit AccessRevoked(msg.sender, _doctor);
    }

    function getPatientRecords(address _patient) public view returns (Record[] memory) {
        // Condition: The person requesting is the Patient themselves, OR they are an authorized doctor
        require(msg.sender == _patient || isAuthorized[_patient][msg.sender], "Not authorized to view these records");
        return patientRecords[_patient];
    }
}