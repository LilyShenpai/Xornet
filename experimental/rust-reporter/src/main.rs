//use sysinfo::{SystemExt};
use rust_socketio::{SocketBuilder, Payload, Socket};
use sysinfo::{SystemExt, NetworkExt};
use serde_json::json;
// use std::time;
// use std::ops::FnMut;
// use std::future::{Future};
use std::thread;
use std::sync::mpsc::channel;
use std::io::stdin;
use std::time::Duration;


fn main() {
    let mut system = sysinfo::System::new_all();
    
    // First we update all information of our system struct.
    system.refresh_all();
    // for (pid, proc_) in system.get_processes() {
    //     println!("{}:{} => status: {:?}", pid, proc_.name(), proc_.status());
    // }

    println!("{:?}", system);
    
    // Display system information:
    println!("System name:             {:?}", system.get_name());
    println!("System kernel version:   {:?}", system.get_kernel_version());
    println!("System OS version:       {:?}", system.get_os_version());
    println!("System host name:        {:?}", system.get_host_name());
    ws_test(system);
    
}

fn ws_test(system: sysinfo::System) {
	//report(system);
	let mut n_total_in = 0;
    let mut n_total_out = 0;
    for interface in system.get_networks() {
        n_total_in += interface.1.get_received();
        n_total_out += interface.1.get_transmitted();
    }

    const URL: &'static str = "http://localhost:8080";        // Get the URL
	let callback = |payload: Payload, mut socket: Socket| {
		match payload {
			Payload::String(str) => println!("Received: {}", str),
			Payload::Binary(bin_data) => println!("Received bytes: {:#?}", bin_data),
		}
		socket.emit("test", json!({"got ack": true})).expect("Server unreachable")
 	};

	let mut socket = SocketBuilder::new(URL)
		.set_namespace("/")
		.expect("illegal namespace")
		.on("test", callback)
		.on("error", |err, _| eprintln!("Error: {:#?}", err))
		.connect()
		.expect("Connection failed");

	// let json_payload = json!({"kekw": 123});
	// socket.emit("report", json_payload).expect("Server unreachable");

	// define a callback, that's executed when the ack got acked
	let ack_callback = |message: Payload, _| {
	    println!("Yehaa! My ack got acked?");
	    println!("Ack data: {:#?}", message);
	};

	// println!("Stats:             {:?}", json_payload);
	// socket.on("bar", )
	let handle = std::thread::spawn(move || loop {
		let json_payload = json!({
			"uuid": "b89734fb689743",
			"isVirtual": false,
			"hostname": system.get_host_name(),
			"platform": system.get_name(),
			"ram": {
			  "total": 420,
			  "free": 69,
			},
			"cpu": 23,
	
			"network": [{ "tx_sec": n_total_in, "rx_sec": n_total_out }],
			"reporterVersion": 0.16,
			"disks": {
				"fs": "G:",
				"type": "NTFS",
				"size": 119489134592i64,
				"used": 55407673344i64,
				"available": 64081461248i64,
				"use": 46.37,
				"mount": "G:"
			  },
			"uptime": 232337,
			"reporterUptime": 58666182,
			"timestamp": 1621427023724i64,
		  });
		// emit with an ack
		let ack = socket
	    .emit_with_ack("report", json_payload, Duration::from_secs(2), ack_callback)
	    .expect("Server unreachable");
		let time_to_wait = Duration::from_millis(1000);
		thread::sleep(time_to_wait);
	});
    handle.join().unwrap();
}

// fn set_interval<F, Fut>(mut f: F, dur: time::Duration)
// where
//     F: Send + 'static + FnMut() -> Fut,
//     Fut: Future<Output = ()> + Send + 'static,
//     {
//         // Interval duration
//         let mut interval = tokio::time::interval(dur);

//         tokio::spawn(async move {
//             // Skip the first tick at 0ms.
//             interval.tick().await;
//             loop {
//                 // Wait until next tick.
//                 interval.tick().await;
//                 tokio::spawn(f());
//             }
//         });
//     }

// fn report(system: sysinfo::System) {
//     // Temperature of the different components:
//     // for component in system.get_components() {
//     //     println!("{:?}", component);
//     // }

//     // for disk in system.get_disks() {
//     //     println!("{:?}", disk);
//     // } 

//     // And then all disks' information:
//     // let mut n_total_in = 0;
//     // let mut n_total_out = 0;
// 	// let mut interface_count = 0;
//     // for interface in system.get_networks() {
// 	// 	interface_count += 1;
//     //     n_total_in += interface.1.get_received();
//     //     n_total_out += interface.1.get_transmitted();
//     // }

//     // println!("total network in : {} kbps", n_total_in);
//     // println!("total network out: {} kbps", n_total_out);
    
//     // println!("total memory: {} KB", system.get_total_memory());
//     // println!("used memory : {} KB", system.get_used_memory());
// }