import React, { useEffect, useRef } from "react";
import { useMUD } from "./MUDContext";
import { SyncStep } from "@latticexyz/store-sync";
import {
  Has,
  getComponentValueStrict,
  getComponentValue,
} from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { addToQueue, getQueue, delQueue } from "./bot/queue";
import { useEntityQuery, useComponentValue } from "@latticexyz/react";

export const App = () => {
  const {
    components: {
      QueueScheduled,
      QueueProcessed,
      SyncProgress
    },
    network: { playerEntity, publicClient },
    systemCalls: { execute_queue },
  } = useMUD();
  const syncProgress = useComponentValue(SyncProgress, singletonEntity) as any;
  const entities_queue_scheduled = useEntityQuery([Has(QueueScheduled)]);
  const lastProcessedIndexRef = useRef<number>(0); // 用于记录上次处理的位置
  console.log(entities_queue_scheduled);
  
  useEffect(() => {

    for (let i = lastProcessedIndexRef.current; i < entities_queue_scheduled.length; i++) {
      const entity = entities_queue_scheduled[i] as any;
      const res = getComponentValueStrict(QueueScheduled, entity);
      const res_processed = getComponentValue(QueueProcessed, entity);
  
      if (!res_processed) {

        addToQueue([entity, res.timestamp, res.name_space, res.name, res.call_data,]);
      }
    }

    // 更新上次处理的位置
    lastProcessedIndexRef.current = entities_queue_scheduled.length;
  }, [entities_queue_scheduled, QueueProcessed, QueueScheduled]);

    setTimeout(() => {
      console.log("============setTimeout==============");
      const getQueueData = getQueue();
      getQueueData.then((q) => {
        const unlockables = Object.values(q).sort((a, b) => Number(a.timestamp - b.timestamp));
        
        for (const res of unlockables) {
          console.log(res);
          
          try {
            execute_queue({ id: res.id, timestamp: res.timestamp, namespace: res.namespace, name: res.name, call_data: res.call_data });
            delQueue(res.id);
            
          }catch(error){
            console.error("Error while processing ", res, error)
          }
      }
      })
    }, 3000);
    return (
<div>
{syncProgress ? (
        syncProgress.step !== SyncStep.LIVE ? (
          <div style={{ color: "#fff" }}>
            {syncProgress.message} ({Math.floor(syncProgress.percentage)}%)
          </div>
        ) : (
          // <Header hoveredData={hoveredData} handleData={handleMouseDown} />
          // <PopUpBox/>
          <div/>
        )
      ) : (
        <div style={{ color: "#000" }}>Hydrating from RPC(0) </div>
      )}
        {/* <div>
        
          Counter: <span></span>
        </div> 
        <button
          style={{zIndex: "99999999999999999999999999"}}
          type="button"
          onClick={async (event) => {
            event.preventDefault();
            //console.log("new counter value:", await increment());
          }}
        >
          Increment
        </button> */}
        </div>
    );

};
