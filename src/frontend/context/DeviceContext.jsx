import React, { createContext, useState, useContext } from 'react';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [selectedDevices, setSelectedDevices] = useState({});

  return (
    <DeviceContext.Provider value={{ selectedDevices, setSelectedDevices }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => useContext(DeviceContext);
