import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Tool = {
  id: number;
  tool_name: string;
  [key: string]: any;
};

function ToolList() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolName, setToolName] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/tools/')
      .then(res => setTools(res.data))
      .catch(err => console.error(err));
  }, []);

  const addTool = () => {
    axios.post<Tool>('http://localhost:8000/api/tools/', { tool_name: toolName })
      .then(res => setTools((prev) => [...prev, res.data]))
      .catch(err => console.error(err));
  };

  const deleteTool = (id: number) => {
    axios.delete(`http://localhost:8000/api/tools/${id}/`)
      .then(() => setTools((prev) => prev.filter((t: Tool) => t.id !== id)))
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h2>Tools</h2>
      <input value={toolName} onChange={e => setToolName(e.target.value)} />
      <button onClick={addTool}>Add Tool</button>
      <ul>
        {tools.map(tool => (
          <li key={tool.id}>
            {tool.tool_name}
            <button onClick={() => deleteTool(tool.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ToolList;
