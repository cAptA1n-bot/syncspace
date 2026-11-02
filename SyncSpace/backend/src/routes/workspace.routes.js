'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const workspaceController = require('../controllers/workspace.controller');
const { body } = require('express-validator');

router.use(authenticate);

router.get('/', workspaceController.listWorkspaces);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Workspace name is required').isLength({ max: 100 }),
], workspaceController.createWorkspace);
router.get('/:id', workspaceController.getWorkspace);
router.patch('/:id', workspaceController.updateWorkspace);
router.get('/:id/members', workspaceController.getMembers);
router.post('/:id/members', workspaceController.inviteMember);
router.patch('/:id/members/:memberId/role', workspaceController.changeMemberRole);
router.delete('/:id/members/:memberId', workspaceController.removeMember);
router.post('/:id/leave', workspaceController.leaveWorkspace);

module.exports = router;
