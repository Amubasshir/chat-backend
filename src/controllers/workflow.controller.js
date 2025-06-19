import { AppError } from '../middleware/errorHandler.js';
import Workflow from '../models/workflow.model.js';

// Create workflow
export const createWorkflow = async (req, res, next) => {
  try {
    const { name, description, steps, organizationId } = req.body;

    const workflow = await Workflow.create({
      name,
      description,
      steps,
      organization: organizationId,
      creator: req.user.id
    });

    await workflow.populate('creator', 'username');

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// Get all workflows
export const getWorkflows = async (req, res, next) => {
  try {
    const { organizationId } = req.query;
    const query = organizationId ? { organization: organizationId } : {};

    const workflows = await Workflow.find(query)
      .populate('creator', 'username')
      .populate('organization', 'name');

    res.status(200).json({
      success: true,
      data: workflows
    });
  } catch (error) {
    next(error);
  }
};

// Get workflow by ID
export const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('creator', 'username')
      .populate('organization', 'name');

    if (!workflow) {
      throw new AppError(404, 'Workflow not found');
    }

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// Update workflow
export const updateWorkflow = async (req, res, next) => {
  try {
    const { name, description, steps } = req.body;
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      throw new AppError(404, 'Workflow not found');
    }

    // Check if user is creator
    if (workflow.creator.toString() !== req.user.id) {
      throw new AppError(403, 'Not authorized to update this workflow');
    }

    workflow.name = name || workflow.name;
    workflow.description = description || workflow.description;
    workflow.steps = steps || workflow.steps;
    await workflow.save();

    await workflow.populate('creator', 'username');

    res.status(200).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
};

// Delete workflow
export const deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      throw new AppError(404, 'Workflow not found');
    }

    // Check if user is creator
    if (workflow.creator.toString() !== req.user.id) {
      throw new AppError(403, 'Not authorized to delete this workflow');
    }

    await workflow.remove();

    res.status(200).json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Execute workflow
export const executeWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      throw new AppError(404, 'Workflow not found');
    }

    // Add execution logic here based on workflow steps
    const executionResult = await executeWorkflowSteps(workflow.steps, req.body);

    // Save execution history
    workflow.executionHistory.push({
      executedBy: req.user.id,
      status: executionResult.success ? 'completed' : 'failed',
      result: executionResult
    });
    await workflow.save();

    res.status(200).json({
      success: true,
      data: executionResult
    });
  } catch (error) {
    next(error);
  }
};

// Get workflow execution history
export const getWorkflowHistory = async (req, res, next) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('executionHistory.executedBy', 'username');

    if (!workflow) {
      throw new AppError(404, 'Workflow not found');
    }

    res.status(200).json({
      success: true,
      data: workflow.executionHistory
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to execute workflow steps
const executeWorkflowSteps = async (steps, input) => {
  try {
    // Implementation will depend on your workflow step types
    // This is a placeholder that should be implemented based on your requirements
    const results = [];
    
    for (const step of steps) {
      const result = await executeStep(step, input);
      results.push(result);
      
      if (!result.success && step.stopOnError) {
        break;
      }
    }

    return {
      success: results.every(r => r.success),
      results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to execute a single workflow step
const executeStep = async (step, input) => {
  // Implementation will depend on your workflow step types
  // This is a placeholder that should be implemented based on your requirements
  switch (step.type) {
    case 'http':
      return executeHttpStep(step, input);
    case 'function':
      return executeFunctionStep(step, input);
    default:
      throw new Error(`Unsupported step type: ${step.type}`);
  }
};
