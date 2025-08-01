import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/feedbacks/')
      .then(res => setFeedbacks(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Feedbacks</h2>
      <ul>
        {(feedbacks as { id: number; message: string; user: string }[]).map(f => (
          <li key={f.id}>{f.message} by {f.user}</li>
        ))}
      </ul>
    </div>
  );
}
export default FeedbackList;
