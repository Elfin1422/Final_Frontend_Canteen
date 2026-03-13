export default function OrderReceipt({ receipt, onNewOrder }) {
  return (
    <div className="receipt-view">
      <div className="receipt">
        <div className="receipt-header">
          <span>🍽️</span>
          <h3>CanteenPOS</h3>
          <p>Order Receipt</p>
        </div>
        <div className="receipt-number">#{receipt.order_number}</div>
        <div className="receipt-items">
          {receipt.order_items?.map(i => (
            <div key={i.id} className="receipt-row">
              <span>{i.menu_item?.name} × {i.quantity}</span>
              <span>₱{Number(i.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="receipt-totals">
          <div className="receipt-row">
            <span>Subtotal</span><span>₱{Number(receipt.subtotal).toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Tax (12%)</span><span>₱{Number(receipt.tax).toFixed(2)}</span>
          </div>
          <div className="receipt-row receipt-total">
            <span>TOTAL</span><span>₱{Number(receipt.total_amount).toFixed(2)}</span>
          </div>
        </div>
        <div className="receipt-status">
          Status: <strong>{receipt.status.toUpperCase()}</strong>
        </div>
        <button type="button" className="btn-primary btn-full" onClick={onNewOrder}>
          New Order
        </button>
      </div>
    </div>
  );
}
