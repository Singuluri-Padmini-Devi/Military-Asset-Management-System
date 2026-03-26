import { useEffect, useState } from "react";
import api from "../api/client";

const initial = {
  assetName: "",
  category: "Vehicle",
  base: "HQ",
  quantity: 1,
  actionType: "assignment",
  assignedTo: "",
  note: "",
};

export default function Assignments() {
  const [form, setForm] = useState(initial);
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/assignments");
    setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/assignments", { ...form, quantity: Number(form.quantity) });
    setForm(initial);
    load();
  };

  return (
    <section>
      <h1>Assignments & Expenditures</h1>
      <form className="card form-grid" onSubmit={submit}>
        <input placeholder="Asset Name" value={form.assetName} onChange={(e) => setForm({ ...form, assetName: e.target.value })} required />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Vehicle</option><option>Weapon</option><option>Ammunition</option><option>Equipment</option>
        </select>
        <input placeholder="Base" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} required />
        <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        <select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>
          <option value="assignment">Assignment</option>
          <option value="expenditure">Expenditure</option>
        </select>
        <input placeholder="Assigned To (if assignment)" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
        <input placeholder="Notes" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type="submit">Submit</button>
      </form>
      <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Base</th><th>Type</th><th>Qty</th><th>Assigned To</th><th>Time</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r._id}><td>{r.assetName}</td><td>{r.base}</td><td>{r.actionType}</td><td>{r.quantity}</td><td>{r.assignedTo || "-"}</td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>)}
      </tbody></table></div>
    </section>
  );
}
