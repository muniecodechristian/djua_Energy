import DeviceCommand from '../models/DeviceCommand.model.js';

export async function enqueueCommand(deviceId, command) {
  await DeviceCommand.create({ deviceId, command });
}

export async function consumeCommands(deviceId) {
  const commands = await DeviceCommand.find({ deviceId, status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(20)
    .lean();

  if (commands.length > 0) {
    await DeviceCommand.updateMany(
      { _id: { $in: commands.map(({ _id }) => _id) } },
      { $set: { status: 'delivered' } }
    );
  }

  return commands.map(({ command, createdAt }) => ({
    command,
    timestamp: createdAt,
  }));
}
