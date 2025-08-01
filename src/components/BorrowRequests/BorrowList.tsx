import React, { useEffect, useState } from 'react';
import axios from 'axios';

function BorrowList() {
  const [borrows, setBorrows] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/borrowrequests/')
      .then(res => setBorrows(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Borrow Requests</h2>
      <ul>
        {(borrows as { id: number; user: string; tool: string }[]).map(b => (
          <li key={b.id}>User {b.user} borrowed Tool {b.tool}</li>
        ))}
      </ul>
    </div>
  );
}
export default BorrowList;
