const PurchaseOrderStatusType = {
    PENDING: { id: 1, name: "Pending" },
    ACCEPTED: { id: 2, name: "Accepted" },
    CLOSED: { id: 3, name: "Closed" },
    REJECTED: { id: 4, name: "Rejected" },
    SENT: { id: 5, name: "Sent" },
    CANCELLED: { id: 6, name: "Cancelled" },
}

module.exports = PurchaseOrderStatusType;