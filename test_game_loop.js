const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function runTest() {
  console.log('🧪 Starting Game Simulation Test...');

  const hostSocket = io(SERVER_URL);

  hostSocket.on('connect', () => {
    console.log('✅ Host connected:', hostSocket.id);
    hostSocket.emit('create_room', { playerName: 'البشمهندس', character: 'bashmohandes' });
  });

  hostSocket.on('room_created', (room) => {
    console.log('✅ Room created with code:', room.code, 'Players count:', room.players.length);

    // Add 4 bots
    console.log('🤖 Adding 4 AI bots for testing...');
    hostSocket.emit('add_bot');
    setTimeout(() => hostSocket.emit('add_bot'), 100);
    setTimeout(() => hostSocket.emit('add_bot'), 200);
    setTimeout(() => hostSocket.emit('add_bot'), 300);

    setTimeout(() => {
      console.log('🔥 Starting Game with room:', room.code);
      hostSocket.emit('start_game');
    }, 800);
  });

  hostSocket.on('game_started', (data) => {
    console.log('🎮 Game Started successfully!');
    console.log('📋 Role assigned:', data.role, '| Tasks count:', data.tasks.length);
    console.log('🎯 Character:', data.character);

    // Simulate task completion
    if (data.tasks.length > 0) {
      console.log('⚡ Completing first task:', data.tasks[0].name);
      hostSocket.emit('task_completed', { taskId: data.tasks[0].id });
    }

    // Trigger Emergency Meeting
    setTimeout(() => {
      console.log('🚨 Triggering Emergency Meeting...');
      hostSocket.emit('emergency_meeting');
    }, 1200);
  });

  hostSocket.on('tasks_updated', (data) => {
    console.log('📊 Task Progress Updated:', data.progress + '%');
  });

  hostSocket.on('game_timer_tick', (data) => {
    console.log(`⏱️ 10-Min Game Deadline Timer Tick: ${data.formatted} (${data.timer}s remaining)`);
  });

  hostSocket.on('meeting_started', (data) => {
    console.log('📢 Meeting Started! Caller:', data.caller, '| Reason:', data.reason);
    console.log('👥 Eligible voters count:', data.players.length);

    // Cast a vote
    setTimeout(() => {
      console.log('🗳️ Casting Skip Vote...');
      hostSocket.emit('cast_vote', { targetId: 'SKIP' });
    }, 600);
  });

  hostSocket.on('chat_message', (data) => {
    console.log(`💬 Chat: [${data.senderName}]: ${data.text}`);
  });

  hostSocket.on('meeting_concluded', (result) => {
    console.log('🚪 Meeting Concluded!');
    console.log('📜 Ejection Announcement:', result.message);

    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    hostSocket.disconnect();
    process.exit(0);
  });

  // Timeout safety
  setTimeout(() => {
    console.error('❌ Test timed out!');
    process.exit(1);
  }, 30000);
}

runTest();
