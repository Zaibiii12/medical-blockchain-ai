// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MedicalRecords {

    // ==============================
    // STRUCT
    // ==============================
    struct Record {

        string fileHash;

        address uploadedBy;

        uint256 timestamp;
    }

    // ==============================
    // STORAGE
    // ==============================
    Record[] public records;

    // ==============================
    // EVENT
    // ==============================
    event RecordUploaded(

        string fileHash,

        address uploadedBy,

        uint256 timestamp
    );

    // ==============================
    // UPLOAD RECORD
    // ==============================
    function uploadRecord(
        string memory _fileHash
    ) public {

        Record memory newRecord = Record({

            fileHash: _fileHash,

            uploadedBy: msg.sender,

            timestamp: block.timestamp
        });

        records.push(newRecord);

        emit RecordUploaded(
            _fileHash,
            msg.sender,
            block.timestamp
        );
    }

    // ==============================
    // GET RECORD COUNT
    // ==============================
    function getRecordCount()
        public
        view
        returns (uint256)
    {
        return records.length;
    }

    // ==============================
    // GET RECORD BY INDEX
    // ==============================
    function getRecord(
        uint256 index
    )
        public
        view
        returns (

            string memory,

            address,

            uint256
        )
    {
        Record memory record = records[index];

        return (

            record.fileHash,

            record.uploadedBy,

            record.timestamp
        );
    }
}