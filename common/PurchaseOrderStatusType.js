const PurchaseOrderStatusType = {
    PENDING: { id: 1, name: "Pending" },
    ACCEPTED: { id: 2, name: "Accepted" },
    CLOSED: { id: 3, name: "Closed" },
    REJECTED: { id: 4, name: "Rejected" },
    SENT_EMAIL: { id: 5, name: "Sent (Email)" },
    CANCELLED: { id: 6, name: "Cancelled" },
    SENT_TEXT: { id: 7, name: "Sent (Text)" },
}

module.exports = PurchaseOrderStatusType;