import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/users/')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  type User = {
    id: number;
    username: string;
    email: string;
    // add other fields if needed
  };

  const deleteUser = (id: number) => {
    setUsers((prevUsers) => prevUsers.filter((u: User) => u.id !== id));
    axios
      .delete(`http://localhost:8000/api/users/${id}/`)
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {(users as User[]).map((user) => (
          <li key={user.id}>
            {user.username} ({user.email})
            <button onClick={() => deleteUser(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default UserList;
