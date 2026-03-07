// 添加房间
document.getElementById('addRoomForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        room_number: document.getElementById('room_number').value,
        monthly_rent: document.getElementById('monthly_rent').value,
        electricity_rate: document.getElementById('electricity_rate').value,
        water_rate: document.getElementById('water_rate').value
    };

    fetch('/rooms/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            addRoomToTable(formData);
            closeAddRoomModal();
        } else {
            // 解析错误信息，显示友好的中文提示
            let errorMsg = data.message || data.error || '添加失败';
            let userFriendlyMsg = parseErrorMessage(errorMsg, '添加');

            // 检查是否是房间号重复的错误
            if (errorMsg.includes('UNIQUE constraint failed') || errorMsg.includes('SQLITE_CONSTRAINT')) {
                userFriendlyMsg = '添加失败，房号重复';
            }

            alert(userFriendlyMsg);
        }
    })
    .catch(error => {
        console.error('添加房间错误:', error);
        // 检查是否是房间号重复的错误
        if (error.code === 'SQLITE_CONSTRAINT' || error.errno === 19) {
            alert('添加失败，房号重复');
        } else {
            alert('添加失败，请重试');
        }
    });
});

// 显示添加房间模态框
function showAddRoomModal() {
    document.getElementById('addRoomModal').style.display = 'block';
}

// 关闭添加房间模态框
function closeAddRoomModal() {
    document.getElementById('addRoomModal').style.display = 'none';
    document.getElementById('addRoomForm').reset();
}

// 将新房间添加到表格
function addRoomToTable(room) {
    const tableBody = document.getElementById('roomsTableBody');
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-room-id', room.id);
    newRow.innerHTML = `
        <td>${room.room_number}</td>
        <td>¥${parseFloat(room.monthly_rent).toFixed(2)}</td>
        <td>¥${parseFloat(room.electricity_rate).toFixed(2)}/度</td>
        <td>¥${parseFloat(room.water_rate).toFixed(2)}/吨</td>
        <td>
            <button onclick="editRoom(${room.id})" class="btn btn-small">编辑</button>
            <a href="/rooms/${room.id}" class="btn btn-small">详情</a>
        </td>
    `;
    tableBody.appendChild(newRow);
}

// 删除房间
function deleteRoom(roomId) {
    if (confirm('确定要删除这个房间吗？')) {
        fetch(`/rooms/${roomId}/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                const row = document.querySelector(`tr[data-room-id="${roomId}"]`);
                if (row) {
                    row.remove();
                }
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('删除房间错误:', error);
            alert('删除失败，请重试');
        });
    }
}

// 编辑房间
function editRoom(roomId) {
    fetch(`/rooms/${roomId}`)
        .then(response => response.json())
        .then(room => {
            document.getElementById('edit_room_id').value = room.id;
            document.getElementById('edit_room_number').value = room.room_number;
            document.getElementById('edit_monthly_rent').value = room.monthly_rent;
            document.getElementById('edit_electricity_rate').value = room.electricity_rate;
            document.getElementById('edit_water_rate').value = room.water_rate;
            document.getElementById('editRoomModal').style.display = 'block';
        })
        .catch(error => {
            console.error('获取房间信息错误:', error);
            alert('获取房间信息失败');
        });
}

// 关闭模态框
function closeModal() {
    document.getElementById('editRoomModal').style.display = 'none';
    document.getElementById('editRoomForm').reset();
}

// 更新房间信息
document.getElementById('editRoomForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        room_number: document.getElementById('edit_room_number').value,
        monthly_rent: document.getElementById('edit_monthly_rent').value,
        electricity_rate: document.getElementById('edit_electricity_rate').value,
        water_rate: document.getElementById('edit_water_rate').value
    };

    const roomId = document.getElementById('edit_room_id').value;

    fetch(`/rooms/${roomId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            updateRoomInTable(roomId, formData.room_number, formData);
            closeModal();
        } else {
            // 解析错误信息，显示友好的中文提示
            let errorMsg = data.message || data.error || '更新失败';
            let userFriendlyMsg = parseErrorMessage(errorMsg, '更新');

            // 检查是否是房间号重复的错误
            if (errorMsg.includes('UNIQUE constraint failed') || errorMsg.includes('SQLITE_CONSTRAINT')) {
                userFriendlyMsg = '更新失败，房号重复';
            }

            alert(userFriendlyMsg);
        }
    })
    .catch(error => {
        console.error('更新房间信息错误:', error);
        // 检查是否是房间号重复的错误
        if (error.code === 'SQLITE_CONSTRAINT' || error.errno === 19) {
            alert('更新失败，房号重复');
        } else {
            alert('更新失败，请重试');
        }
    });
});

// 更新表格中的房间信息
function updateRoomInTable(roomId, roomNumber, formData) {
    const row = document.querySelector(`tr[data-room-id="${roomId}"]`);
    if (row) {
        row.cells[0].textContent = roomNumber;
        row.cells[1].textContent = `¥${parseFloat(formData.monthly_rent).toFixed(2)}`;
        row.cells[2].textContent = `¥${parseFloat(formData.electricity_rate).toFixed(2)}/度`;
        row.cells[3].textContent = `¥${parseFloat(formData.water_rate).toFixed(2)}/吨`;
    }
}

// 生成收据
document.getElementById('generateReceiptForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        room_id: document.getElementById('room_id').value,
        receipt_month: document.getElementById('receipt_month').value,
        electricity_before: document.getElementById('electricity_before').value,
        electricity_after: document.getElementById('electricity_after').value,
        water_before: document.getElementById('water_before').value,
        water_after: document.getElementById('water_after').value
    };

    fetch('/receipts/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('生成收据错误:', error);
        alert('生成失败，请重试');
    });
});

// 更新电表水表读数
function updateMeterReadings() {
    const roomId = document.getElementById('room_id').value;
    const receiptMonth = document.getElementById('receipt_month').value;

    if (!roomId || !receiptMonth) {
        return;
    }

    fetch(`/rooms/${roomId}`)
        .then(response => response.json())
        .then(room => {
            if (room && room.electricity_before !== undefined) {
                document.getElementById('electricity_before').value = room.electricity_before;
            }
            if (room && room.water_before !== undefined) {
                document.getElementById('water_before').value = room.water_before;
            }
        })
        .catch(error => {
            console.error('获取房间信息错误:', error);
        });
}

// 支付收据
function payReceipt(receiptId) {
    if (confirm('确定要支付这张收据吗？')) {
        fetch(`/receipts/${receiptId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('支付收据错误:', error);
            alert('支付失败，请重试');
        });
    }
}

// 设置默认月份为当前月份
document.addEventListener('DOMContentLoaded', function() {
    const receiptMonthInput = document.getElementById('receipt_month');
    if (receiptMonthInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        receiptMonthInput.value = `${year}-${month}`;
    }
});

// 点击模态框外部关闭
window.onclick = function(event) {
    const addModal = document.getElementById('addRoomModal');
    const editModal = document.getElementById('editRoomModal');
    if (event.target == addModal) {
        closeAddRoomModal();
    }
    if (event.target == editModal) {
        closeModal();
    }
}

/**
 * 解析错误消息，转换为友好的中文提示
 * @param {string} errorMsg - 错误消息
 * @param {string} action - 操作类型（添加/更新）
 * @returns {string} 友好的中文提示
 */
function parseErrorMessage(errorMsg, action) {
    if (!errorMsg) return `${action}失败，请重试`;

    const errorLower = errorMsg.toLowerCase();

    // 房间号重复
    if (errorLower.includes('room_number') && (errorLower.includes('unique') || errorLower.includes('constraint'))) {
        return `${action}失败，房号重复`;
    }

    // 房间ID不存在
    if (errorLower.includes('room') && (errorLower.includes('not found') || errorLower.includes('doesn\'t exist'))) {
        return `${action}失败，房间不存在`;
    }

    // 数据格式错误
    if (errorLower.includes('invalid') || errorLower.includes('format')) {
        return `${action}失败，数据格式错误`;
    }

    // 数据库错误
    if (errorLower.includes('database') || errorLower.includes('sql')) {
        return `${action}失败，数据库错误`;
    }

    // 默认返回原始错误消息
    return errorMsg;
}
