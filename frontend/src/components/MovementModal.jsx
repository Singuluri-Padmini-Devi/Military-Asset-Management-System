export default function MovementModal({ open, onClose, items, title }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <button className="close" onClick={onClose}>X</button>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Base</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={`${it._id}-${it.base}`}>
                  <td>{it.assetName}</td>
                  <td>{it.category}</td>
                  <td>{it.base}</td>
                  <td>{it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
