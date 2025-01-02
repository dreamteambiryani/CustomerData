
let actionType;
let currentRowId;

function showModal(message, action) {
    actionType = action;
    document.getElementById('confirmationModalBody').innerText = message;
    $('#confirmationModal').modal('show');

    if (action === "success") {
        document.getElementById('confirmAction').style.display = "none";
    } else {
        document.getElementById('confirmAction').style.display = "inline-block";
    }
}

function confirmUpdate() {
    showModal("Are you sure you want to update this data?", "update");
}

function confirmDelete(rowId) {
    currentRowId = rowId;
    showModal("Are you sure you want to delete this data?", "delete");
}

document.getElementById('confirmAction').addEventListener('click', function () {
    if (actionType === "update") {
        updateData();
    } else if (actionType === "delete") {
        deleteData(currentRowId);
    }
    $('#confirmationModal').modal('hide');
});

function fetchDataBatch(startIndex, batchSize, callback) {
    $.ajax({
        url: 'https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=read&startIndex=' + startIndex + '&batchSize=' + batchSize,
        method: 'GET',
        success: function (response) {
            const data = JSON.parse(response);
            renderTable(data);
            if (callback) callback(data.length < batchSize);
        }
    });
}

function renderTable(data) {
    const table = document.createDocumentFragment();
    
    // Reverse the data array
    data.reverse();

    data.forEach((row, index) => {
        const srNo = data.length - index;  // Sr No in descending order
        const tr = document.createElement('tr');
        tr.id = 'row-' + srNo;  // Row ID based on Sr No
        tr.innerHTML = `
            <td class="actions">
                <button class="btn btn-warning btn-sm" onclick="editRow(${srNo})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${srNo})">Delete</button>
            </td>
            <td>${srNo}</td>  <!-- Sr No in descending order -->
            <td>${row[0]}</td>  <!-- Correct Customer Name -->
            <td>${row[1]}</td>  <!-- Correct Mobile No -->
            <td>${row[2]}</td>  <!-- Correct Type -->
            <td>${row[3]}</td>  <!-- Correct Price -->
            <td>${row[4]}</td>  <!-- Correct Quantity -->
            <td>${row[5]}</td>  <!-- Correct Mode of Payment -->
            <td>${row[7]}</td>  <!-- Correct Language -->
        `;
        table.appendChild(tr);
    });
    const dataTable = document.getElementById('dataTable');
    dataTable.innerHTML = '';  // Clear existing rows
    dataTable.appendChild(table);
}

function loadData() {
    let startIndex = 0;
    const batchSize = 10; // Adjust the batch size as needed

    function fetchNextBatch() {
        fetchDataBatch(startIndex, batchSize, (isLastBatch) => {
            if (!isLastBatch) {
                startIndex += batchSize;
                fetchNextBatch();
            }
        });
    }

    fetchNextBatch();
}

function editRow(rowId) {
    const loadingIndicator = document.createElement('tr');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.innerHTML = '<td colspan="9">Loading...</td>';
    document.getElementById('dataTable').appendChild(loadingIndicator);

    $.ajax({
        url: 'https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=read&rowId=' + rowId,
        method: 'GET',
        success: function (response) {
            $('#loadingIndicator').remove();
            const data = JSON.parse(response);
            $('#rowId').val(rowId);
            $('#customerName').val(data[0]);
            $('#phoneNo').val(data[1]);
            $('#type').val(data[2]);
            $('#price').val(data[3]);
            $('#quantity').val(data[4]);
            $('#paymentMode').val(data[5]);
            $('#language').val(data[7]);  // Corrected Language field

            document.getElementById('manageForm').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function updateData() {
    const formData = $('#manageForm').serialize();
    const rowId = $('#rowId').val();
    showModal("Updating data...", "success"); // Show updating status immediately
    $.ajax({
        url: 'https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=update',
        method: 'POST',
        data: formData,
        success: function (response) {
            showModal(response, "success");
            fetchDataBatch(0, 10, () => { // Reload the first batch of data
                document.getElementById('row-' + rowId).scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    });
}

function deleteData(rowId) {
    showModal("Deleting data...", "success"); // Show deleting status immediately
    $('#row-' + rowId).remove(); // Immediately remove the row for faster UI update

    $.ajax({
        url: 'https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=delete&rowId=' + rowId,
        method: 'POST',
        success: function (response) {
            showModal(response, "success");
            fetchDataBatch(0, 10); // Reload the first batch of data
        }
    });
}

$(document).ready(function () {
    loadData();
});
