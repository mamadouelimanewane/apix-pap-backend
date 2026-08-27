import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { communicationController } from '../controllers/communication.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/messages/:papCode', communicationController.listMessages);
router.get('/messages-all', (req, res, next) => {
  req.params.papCode = undefined;
  communicationController.listMessages(req, res, next);
});
router.get('/:messageCode', communicationController.getMessageById);
router.get('/notifications/:papCode', communicationController.getNotifications);
router.post('/send/:papCode', communicationController.sendMessage);
router.post('/notify/:papCode', communicationController.createNotification);
router.post('/read/:messageCode', communicationController.markAsRead);
router.delete('/:messageCode', communicationController.deleteMessage);
router.get('/stats/:papCode', communicationController.getCommunicationStats);

export default router;
