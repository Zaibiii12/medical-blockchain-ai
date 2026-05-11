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
    mapping(address => mapping(address => bool)) public isAuthorized;
    
    // NEW: Arrays to keep track of lists for the UI
    mapping(address => address[]) public patientAuthorizedDoctors;
    mapping(address => address[]) public patientPendingRequests;
    mapping(address => mapping(address => bool)) public hasRequested;

    event RecordAdded(address indexed patient, string fileHash);
    event DoctorAdded(address indexed doctor);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);
    
    // NEW: Enterprise Events
    event AccessRequested(address indexed doctor, address indexed patient);
    event EmergencyOverride(address indexed doctor, address indexed patient, uint256 timestamp);

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

    // --- FEATURE 1: DOCTOR REQUESTS ACCESS ---
    function requestAccess(address _patient) public onlyRole(DOCTOR_ROLE) {
        require(!isAuthorized[_patient][msg.sender], "Already authorized");
        require(!hasRequested[_patient][msg.sender], "Request already pending");
        
        hasRequested[_patient][msg.sender] = true;
        patientPendingRequests[_patient].push(msg.sender);
        
        emit AccessRequested(msg.sender, _patient);
    }

    function getPendingRequests() public view returns (address[] memory) {
        return patientPendingRequests[msg.sender];
    }

    // --- FEATURE 2: PATIENT MANAGES PERMISSIONS ---
    function grantAccess(address _doctor) public {
        isAuthorized[msg.sender][_doctor] = true;
        hasRequested[msg.sender][_doctor] = false; // Clear pending status

        // Add to the authorized list so the UI can display it
        bool exists = false;
        for(uint i=0; i<patientAuthorizedDoctors[msg.sender].length; i++) {
            if(patientAuthorizedDoctors[msg.sender][i] == _doctor) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            patientAuthorizedDoctors[msg.sender].push(_doctor);
        }

        emit AccessGranted(msg.sender, _doctor);
    }

    function revokeAccess(address _doctor) public {
        isAuthorized[msg.sender][_doctor] = false;
        emit AccessRevoked(msg.sender, _doctor);
    }

    function getAuthorizedDoctors() public view returns (address[] memory) {
        return patientAuthorizedDoctors[msg.sender];
    }

    function checkAuthorization(address _patient, address _doctor) public view returns (bool) {
        return isAuthorized[_patient][_doctor];
    }

    // --- FEATURE 3: EMERGENCY OVERRIDE ---
    function emergencyOverride(address _patient) public onlyRole(DOCTOR_ROLE) {
        require(!isAuthorized[_patient][msg.sender], "Already authorized");
        
        // Force grant access
        isAuthorized[_patient][msg.sender] = true;
        
        // Add to patient's authorized list so they see the doctor breached the vault
        bool exists = false;
        for(uint i=0; i<patientAuthorizedDoctors[_patient].length; i++) {
            if(patientAuthorizedDoctors[_patient][i] == msg.sender) {
                exists = true;
                break;
            }
        }
        if(!exists) {
            patientAuthorizedDoctors[_patient].push(msg.sender);
        }

        // Fire the severe audit event
        emit EmergencyOverride(msg.sender, _patient, block.timestamp);
    }

    function getPatientRecords(address _patient) public view returns (Record[] memory) {
        require(msg.sender == _patient || isAuthorized[_patient][msg.sender], "Not authorized. Doctors must request access or trigger Emergency Override.");
        return patientRecords[_patient];
    }
}