// 添加房间（仅在房间管理页面存在）
if (document.getElementById('addRoomForm')) {
    document.getElementById('addRoomForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            room_number: document.getElementById('room_number').value,
            monthly_rent: document.getElementById('monthly_rent').value,
            electricity_rate: document.getElementById('electricity_rate').value,
            water_rate: document.getElementById('water_rate').value,
            housekeeping_fee: document.getElementById('housekeeping_fee').value,
            internet_fee: document.getElementById('internet_fee').value
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
}

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
        <td>¥${parseFloat(room.housekeeping_fee).toFixed(2)}</td>
        <td>¥${parseFloat(room.internet_fee).toFixed(2)}</td>
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
    fetch(`/rooms/${roomId}/json`)
        .then(response => response.json())
        .then(room => {
            if (room.success) {
                document.getElementById('edit_room_id').value = room.room.id;
                document.getElementById('edit_room_number').value = room.room.room_number;
                document.getElementById('edit_monthly_rent').value = room.room.monthly_rent;
                document.getElementById('edit_electricity_rate').value = room.room.electricity_rate;
                document.getElementById('edit_water_rate').value = room.room.water_rate;
                document.getElementById('edit_housekeeping_fee').value = room.room.housekeeping_fee || 0;
                document.getElementById('edit_internet_fee').value = room.room.internet_fee || 0;
                document.getElementById('editRoomModal').style.display = 'block';
            } else {
                alert(room.message || '获取房间信息失败');
            }
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

// 更新房间信息（仅在房间管理页面存在）
if (document.getElementById('editRoomForm')) {
    document.getElementById('editRoomForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            room_number: document.getElementById('edit_room_number').value,
            monthly_rent: document.getElementById('edit_monthly_rent').value,
            electricity_rate: document.getElementById('edit_electricity_rate').value,
            water_rate: document.getElementById('edit_water_rate').value,
            housekeeping_fee: document.getElementById('edit_housekeeping_fee').value,
            internet_fee: document.getElementById('edit_internet_fee').value
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
}

// 更新表格中的房间信息
function updateRoomInTable(roomId, roomNumber, formData) {
    const row = document.querySelector(`tr[data-room-id="${roomId}"]`);
    if (row) {
        row.cells[0].textContent = roomNumber;
        row.cells[1].textContent = `¥${parseFloat(formData.monthly_rent).toFixed(2)}`;
        row.cells[2].textContent = `¥${parseFloat(formData.electricity_rate).toFixed(2)}/度`;
        row.cells[3].textContent = `¥${parseFloat(formData.water_rate).toFixed(2)}/吨`;
        row.cells[4].textContent = `¥${parseFloat(formData.housekeeping_fee).toFixed(2)}`;
        row.cells[5].textContent = `¥${parseFloat(formData.internet_fee).toFixed(2)}`;
    }
}

// 生成收据（仅在收据管理页面存在）
if (document.getElementById('generateReceiptForm')) {
    document.getElementById('generateReceiptForm').addEventListener('submit', function(e) {
        e.preventDefault();

        try {
            const formData = {
                room_id: document.getElementById('room_id').value,
                receipt_month: document.getElementById('receipt_month').value,
                electricity_before: document.getElementById('electricity_before').value,
                electricity_after: document.getElementById('electricity_after').value,
                water_before: document.getElementById('water_before').value,
                water_after: document.getElementById('water_after').value
            };

            console.log('准备生成收据:', formData);

            fetch('/receipts/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                console.log('响应状态:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('服务器响应:', data);

                if (data.success) {
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert(data.message || '生成失败');
                }
            })
            .catch(error => {
                console.error('生成收据错误详情:', error);
                console.error('错误堆栈:', error.stack);

                let errorMessage = '生成收据失败';

                // 检查网络错误
                if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                    errorMessage = '无法连接到服务器，请检查服务器是否正在运行';
                }
                // 检查HTTP错误
                else if (error.message.includes('HTTP错误')) {
                    errorMessage = error.message;
                }
                // 其他错误
                else {
                    errorMessage = `${error.message}\n\n请检查浏览器控制台(F12)查看详细错误信息`;
                }

                alert(errorMessage);
            });
        } catch (error) {
            console.error('生成收据异常:', error);
            alert('发生意外错误: ' + error.message);
        }
    });
}

// 更新电表水表读数（自动从数据库读取上月读数）
function updateMeterReadings() {
    const roomId = document.getElementById('room_id').value;
    const receiptMonth = document.getElementById('receipt_month').value;

    if (!roomId || !receiptMonth) {
        return;
    }

    console.log('准备查询上月读数:', { roomId, receiptMonth });

    fetch(`/receipts/meter-readings/${roomId}/${receiptMonth}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.electricity_before !== undefined) {
                console.log('找到上月读数:', data);
                document.getElementById('electricity_before').value = data.electricity_before;
                document.getElementById('water_before').value = data.water_before;
                alert('已自动填充上月水电读数');
            } else {
                console.log('未找到上月读数，需要手动填写:', data.message);
                // 清空上月读数字段，提示用户手动填写
                document.getElementById('electricity_before').value = '';
                document.getElementById('water_before').value = '';
                alert('未找到上月读数，请手动填写');
            }
        })
        .catch(error => {
            console.error('获取上月读数错误:', error);
            alert('获取上月读数失败，请手动填写');
        });
}

// 编辑电表水表读数
function editReading(readingId) {
    console.log('开始编辑读数，ID:', readingId);

    // 获取房间ID
    const row = document.querySelector(`tr[data-reading-id="${readingId}"]`);
    const roomId = row ? row.getAttribute('data-room-id') : null;

    if (!roomId) {
        alert('无法获取房间ID');
        return;
    }

    console.log('房间ID:', roomId);

    fetch(`/rooms/${roomId}/meter-readings/${readingId}`)
        .then(response => response.json())
        .then(reading => {
            console.log('获取到的读数数据:', reading);

            if (reading.success) {
                // 检查 reading.reading 是否存在
                if (!reading.reading) {
                    alert('获取读数失败：数据格式错误');
                    return;
                }

                console.log('填充表单数据:', reading.reading);

                document.getElementById('edit_reading_id').value = reading.reading.id;
                document.getElementById('edit_reading_date').value = reading.reading.reading_date;
                document.getElementById('edit_electricity_before').value = reading.reading.electricity_before;
                document.getElementById('edit_electricity_after').value = reading.reading.electricity_after;
                document.getElementById('edit_water_before').value = reading.reading.water_before;
                document.getElementById('edit_water_after').value = reading.reading.water_after;

                console.log('显示编辑模态框');
                document.getElementById('editReadingModal').style.display = 'block';
            } else {
                alert(reading.message || '获取读数失败');
            }
        })
        .catch(error => {
            console.error('获取读数错误:', error);
            alert('获取读数失败');
        });
}

// 删除电表水表读数
function deleteReading(readingId) {
    if (confirm('确定要删除这条读数记录吗？')) {
        // 获取房间ID
        const row = document.querySelector(`tr[data-reading-id="${readingId}"]`);
        const roomId = row ? row.getAttribute('data-room-id') : null;

        if (!roomId) {
            alert('无法获取房间ID');
            return;
        }

        fetch(`/rooms/${roomId}/meter-readings/${readingId}`, {
            method: 'DELETE',
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
            console.error('删除读数错误:', error);
            alert('删除读数失败');
        });
    }
}

// 获取单个读数详情
function getReading(readingId) {
    return fetch(`/rooms/meter-readings/${readingId}`)
        .then(response => response.json());
}

// 关闭编辑读数模态框
function closeEditReadingModal() {
    document.getElementById('editReadingModal').style.display = 'none';
    document.getElementById('editReadingForm').reset();
}

// 编辑读数表单提交
if (document.getElementById('editReadingForm')) {
    document.getElementById('editReadingForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            reading_date: document.getElementById('edit_reading_date').value,
            electricity_before: document.getElementById('edit_electricity_before').value,
            electricity_after: document.getElementById('edit_electricity_after').value,
            water_before: document.getElementById('edit_water_before').value,
            water_after: document.getElementById('edit_water_after').value
        };

        const readingId = document.getElementById('edit_reading_id').value;

        fetch(`/rooms/meter-readings/${readingId}`, {
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
                closeEditReadingModal();
                window.location.reload();
            } else {
                alert(data.message || '更新失败');
            }
        })
        .catch(error => {
            console.error('更新读数错误:', error);
            alert('更新读数失败，请重试');
        });
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
    const roomIdSelect = document.getElementById('room_id');

    // 设置默认月份为当前月份
    if (receiptMonthInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        receiptMonthInput.value = `${year}-${month}`;

        // 如果房间已选择，自动查询上月读数
        if (roomIdSelect && roomIdSelect.value) {
            updateMeterReadings();
        }
    }
});

// 点击模态框外部关闭
window.onclick = function(event) {
    const addModal = document.getElementById('addRoomModal');
    const editModal = document.getElementById('editRoomModal');
    const editReceiptModal = document.getElementById('editReceiptModal');
    if (event.target == addModal) {
        closeAddRoomModal();
    }
    if (event.target == editModal) {
        closeModal();
    }
    if (event.target == editReceiptModal) {
        closeEditReceiptModal();
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

// 显示修改收据模态框
function showEditReceiptModal(receiptId) {
    fetch(`/receipts/${receiptId}`)
        .then(response => response.json())
        .then(receipt => {
            if (receipt) {
                document.getElementById('edit_receipt_id').value = receipt.id;
                document.getElementById('edit_receipt_month').value = receipt.receipt_month;
                // 只设置表单中实际存在的字段
                if (receipt.electricity_before !== undefined) {
                    document.getElementById('edit_electricity_before').value = receipt.electricity_before;
                }
                if (receipt.electricity_after !== undefined) {
                    document.getElementById('edit_electricity_after').value = receipt.electricity_after;
                }
                if (receipt.water_before !== undefined) {
                    document.getElementById('edit_water_before').value = receipt.water_before;
                }
                if (receipt.water_after !== undefined) {
                    document.getElementById('edit_water_after').value = receipt.water_after;
                }
                document.getElementById('editReceiptModal').style.display = 'block';
            } else {
                alert('获取收据信息失败');
            }
        })
        .catch(error => {
            console.error('获取收据信息错误:', error);
            alert('获取收据信息失败');
        });
}

// 关闭修改收据模态框
function closeEditReceiptModal() {
    document.getElementById('editReceiptModal').style.display = 'none';
    document.getElementById('editReceiptForm').reset();
}

// 更新收据（仅在修改收据模态框存在）
if (document.getElementById('editReceiptForm')) {
    document.getElementById('editReceiptForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            receipt_month: document.getElementById('edit_receipt_month').value,
            electricity_before: document.getElementById('edit_electricity_before').value,
            electricity_after: document.getElementById('edit_electricity_after').value,
            water_before: document.getElementById('edit_water_before').value,
            water_after: document.getElementById('edit_water_after').value
        };

        const receiptId = document.getElementById('edit_receipt_id').value;

        fetch(`/receipts/${receiptId}/update`, {
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
                alert(data.message || '更新失败');
            }
        })
        .catch(error => {
            console.error('更新收据错误:', error);
            alert('更新失败，请重试');
        });
    });
}

// 删除收据
function deleteReceipt(receiptId) {
    if (confirm('确定要删除这张收据吗？')) {
        fetch(`/receipts/${receiptId}/delete`, {
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
            console.error('删除收据错误:', error);
            alert('删除失败，请重试');
        });
    }
}

// 支付收据
function payReceipt(receiptId) {
    if (confirm('确定要标记为已支付吗？')) {
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
