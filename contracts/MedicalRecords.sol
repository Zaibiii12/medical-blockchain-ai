// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import OpenZeppelin's AccessControl for role management
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MedicalRecords is AccessControl {
    // Define the Doctor role
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");

    struct Record {
        address patient;
        string fileHash;
        string description;
        address uploadedBy;
        uint256 timestamp;
    }

    // Mapping from a patient's address to an array of their medical records
    mapping(address => Record[]) private patientRecords;

    // Events to log activities on the blockchain
    event RecordUploaded(address indexed patient, address indexed doctor, string fileHash);
    event DoctorAdded(address indexed doctor);
    event DoctorRemoved(address indexed doctor);

    constructor() {
        // Grant the contract deployer the default admin role.
        // The admin can add or remove doctors.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- Admin Functions ---

    /**
     * @dev Adds a new doctor. Only callable by the Admin.
     */
    function addDoctor(address _doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DOCTOR_ROLE, _doctor);
        emit DoctorAdded(_doctor);
    }

    /**
     * @dev Removes a doctor. Only callable by the Admin.
     */
    function removeDoctor(address _doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(DOCTOR_ROLE, _doctor);
        emit DoctorRemoved(_doctor);
    }

    // --- Core Functions ---

    /**
     * @dev Uploads a medical record. Only callable by addresses with the DOCTOR_ROLE.
     */
    function uploadRecord(
        address _patient,
        string memory _fileHash,
        string memory _description
    ) external onlyRole(DOCTOR_ROLE) {
        require(_patient != address(0), "Invalid patient address");
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");

        Record memory newRecord = Record({
            patient: _patient,
            fileHash: _fileHash,
            description: _description,
            uploadedBy: msg.sender,
            timestamp: block.timestamp
        });

        patientRecords[_patient].push(newRecord);

        emit RecordUploaded(_patient, msg.sender, _fileHash);
    }

    /**
     * @dev Retrieves all records for a specific patient.
     * Accessible by the patient themselves, or any authorized doctor.
     */
    function getPatientRecords(address _patient) external view returns (Record[] memory) {
        require(
            msg.sender == _patient || hasRole(DOCTOR_ROLE, msg.sender),
            "Not authorized to view these records"
        );
        return patientRecords[_patient];
    }

    /**
     * @dev Gets the total count of records for a patient.
     */
    function getRecordCount(address _patient) external view returns (uint256) {
        require(
            msg.sender == _patient || hasRole(DOCTOR_ROLE, msg.sender),
            "Not authorized to view record count"
        );
        return patientRecords[_patient].length;
    }
}