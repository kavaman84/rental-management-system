// 更新房间信息
document.getElementById('updateRoomForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = {
        monthly_rent: document.getElementById('monthly_rent').value,
        tax_rate: document.getElementById('tax_rate').value,
        electricity_rate: document.getElementById('electricity_rate').value,
        water_rate: document.getElementById('water_rate').value
    };

    const roomId = <%= room.id %>;

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
