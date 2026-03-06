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
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('添加房间错误:', error);
        alert('添加失败，请重试');
    });
});

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
                window.location.reload();
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
}

// 更新房间信息
document.getElementById('editRoomForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
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
            closeModal();
            window.location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('更新房间信息错误:', error);
        alert('更新失败，请重试');
    });
});

// 生成收据
document.getElementById('generateReceiptForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        room_id: document.getElementById('room_id').value,
        receipt_month: document.getElementById('receipt_month').value
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
    const modal = document.getElementById('editRoomModal');
    if (event.target == modal) {
        closeModal();
    }
}
