'use client'
import React from "react";
import { useEhContext } from '../context/EhContext';

export function ShowContext() {
    const props = useEhContext();
    return (<pre>
       {JSON.stringify(props, null, 2)}
   </pre>)
}
