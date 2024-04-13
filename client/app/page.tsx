"use client";
import React, { useEffect, useState } from "react";

interface Order {
  order_id: number;
  status: string;
}

interface ReadyStateProps {
  status: number;
  channel: string;
}

const ReadyState: React.FC<ReadyStateProps> = ({ status, channel }) => {
  return (
    <div className="flex items-center justify-center text-lg border-2 p-2 ">
      <p className="text-center">Status: </p>
      {status === 1 && <div className="mx-2">Connected to {channel}</div>}
      {status === 0 && <div className="mx-2">Connecting</div>}
    </div>
  );
};

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [channel, setChannel] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [readyState, setReadyState] = useState<number>(0);

  const setUpEventSource = () => {
    const newEventSource = new EventSource(
      "http://localhost:8000/" + user + "/" + channel
    );
    newEventSource.onmessage = (event) => {
      const newOrder = JSON.parse(event.data);
      setOrders((prevOrders) => [...prevOrders, newOrder]);
    };
    newEventSource.onopen = () => {
      setReadyState(1);
    };
    newEventSource.onerror = () => {
      setReadyState(0);
    };
    setEventSource(newEventSource);
  };

  const cleanUpEventSource = () => {
    eventSource?.close();
    setEventSource(null);
  };

  return (
    <div className="flex flex-col mx-auto bg-black text-white my-10 border-2 border-white w-1/3 min-h-96 ">
      {eventSource ? (
        <>
          <div className="flex p-4 justify-center space-x-1">
            <ReadyState status={readyState} channel={channel} />
            <button
              className="flex border-2 p-2 border-white  transition-colors duration-200 ease-in-out hover:bg-white hover:text-black"
              onClick={cleanUpEventSource}
            >
              Disconnect
            </button>
          </div>

          <div className="flex flex-col justify-center items-center">
            {orders.map((order, index) => (
              <div key={index} className="mb-2">
                <p className="text-lg">
                  Order ID: {order.order_id} - Status: {order.status}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-center text-lg mt-2">Enter user ID</p>
          <input
            type="text"
            className="bg-black text-white border-2 border-white text-center w-1/2 mx-auto my-4"
            onChange={(e) => setUser(e.target.value)}
          />
          <p className="text-center text-lg">Enter channel name</p>
          <input
            type="text"
            className="bg-black text-white border-2 border-white text-center w-1/2 mx-auto my-4"
            onChange={(e) => setChannel(e.target.value)}
          />
          <button
            className="mx-auto my-12 p-2 px-12 border-2 border-white  transition-colors duration-200 ease-in-out hover:bg-white hover:text-black"
            onClick={setUpEventSource}
          >
            Connect
          </button>
        </>
      )}
    </div>
  );
};

export default App;
