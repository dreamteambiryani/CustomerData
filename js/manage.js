let actionType;
let currentRowId;

function showModal(message, action) {
    actionType = action;
    document.getElementById('confirmationModalBody').innerText = message;
    $('#confirmationModal').modal('show');

    document.getElementById('confirmAction').style.display = action === "success" ? "none" : "inline-block";
}

function confirmUpdate() {
    showModal("Are you sure you want to update this data?", "update");
}

function confirmDelete(rowId) {
    currentRowId = rowId;
    showModal("Are you sure you want to delete this data?", "delete");
}

document.getElementById('confirmAction').addEventListener('click', () => {
    if (actionType === "update") {
        updateData();
    } else if (actionType === "delete") {
        deleteData(currentRowId);
    }
    $('#confirmationModal').modal('hide');
});

async function fetchDataBatch(startIndex, batchSize, callback) {
    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=read&startIndex=${startIndex}&batchSize=${batchSize}`);
        const data = await response.json();
        renderTable(data);
        if (callback) callback(data.length < batchSize);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function renderTable(data) {
    const table = document.createDocumentFragment();
    data.reverse().forEach((row, index) => {
        const srNo = data.length - index;
        const tr = document.createElement('tr');
        tr.id = 'row-' + srNo;
        tr.innerHTML = `
            <td class="actions">
                <button class="btn btn-warning btn-sm" onclick="editRow(${srNo})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete(${srNo})">Delete</button>
            </td>
            <td>${srNo}</td>
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]}</td>
            <td>${row[7]}</td>
        `;
        table.appendChild(tr);
    });
    const dataTable = document.getElementById('dataTable');
    dataTable.innerHTML = '';
    dataTable.appendChild(table);
}

function loadData() {
    let startIndex = 0;
    const batchSize = 10;

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

async function editRow(rowId) {
    const loadingIndicator = document.createElement('tr');
    loadingIndicator.id = 'loadingIndicator';
    loadingIndicator.innerHTML = '<td colspan="9">Loading...</td>';
    document.getElementById('dataTable').appendChild(loadingIndicator);

    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=read&rowId=${rowId}`);
        const data = await response.json();
        $('#loadingIndicator').remove();
        $('#rowId').val(rowId);
        $('#customerName').val(data[0]);
        $('#phoneNo').val(data[1]);
        $('#type').val(data[2]);
        $('#price').val(data[3]);
        $('#quantity').val(data[4]);
        $('#paymentMode').val(data[5]);
        $('#language').val(data[7]);

        document.getElementById('manageForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error fetching row data:', error);
    }
}

async function updateData() {
    const formData = new URLSearchParams(new FormData(document.getElementById('manageForm')));
    const rowId = $('#rowId').val();
    showModal("Updating data...", "success");

    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=update', {
            method: 'POST',
            body: formData
        });
        const result = await response.text();
        showModal(result, "success");
        fetchDataBatch(0, 10, () => {
            document.getElementById('row-' + rowId).scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

async function deleteData(rowId) {
    showModal("Deleting data...", "success");
    $('#row-' + rowId).remove();

    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbwdarDqI5EfF9IpCp42Ov6TrwbmqK43xQGhxENI2dMlvMv7lmm_sd-QXya56aoqkGBc/exec?action=delete&rowId=${rowId}`, {
            method: 'POST'
        });
        const result = await response.text();
        showModal(result, "success");
        fetchDataBatch(0, 10);
    } catch (error) {
        console.error('Error deleting data:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
});
