"use client";

import { Form, Input, Button, Select, message } from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs"; // Assuming dayjs is installed

export default function Expense({ getCategories, fetchData, editData }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Fetch the categories using the passed function
  useEffect(() => {
    const fetchCategories = async () => {
      const currentMonth = dayjs(); // Current month as a dayjs object
      const budgetCategories = await getCategories(currentMonth);
      setCategories(budgetCategories);
    };
    fetchCategories();
  }, [getCategories]);

  // Populate the form with editData if provided
  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        name: editData.name,
        amount: editData.amount,
        categoryId: editData.budgetId._id, // Assuming budgetId contains the ID of the selected category
      });
    }
  }, [editData, form]);

  // Form submit handler
  const onFinish = async (values) => {
    const expenseData = {
      name: values.name,
      amount: values.amount,
      budgetId: values.categoryId, // Budget ID
    };

    setLoading(true); // Start loading

    try {
      const method = editData ? "PUT" : "POST"; // Determine method based on edit or add
      const url = editData ? `/api/expense/${editData._id}` : "/api/expense"; // Dynamic URL for editing

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (res.ok) {
        message.success(editData ? "Expense updated successfully!" : "Expense added successfully!"); // Success notification
        form.resetFields(); // Clear form after successful submission
        fetchData(); // Refresh the data after adding or updating expense
      } else {
        message.error("Failed to save expense. Please try again.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
      console.error("Error submitting expense:", error);
    } finally {
      setLoading(false); // Stop loading after submission
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6 shadow-lg bg-light-bg rounded-lg">
      <h1 className="gradient-text-blue text-xl font-semibold mb-6">
        {editData ? "Edit Your Expense" : "Add Your Expense"} {/* Dynamic Title */}
      </h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="space-y-4"
      >
        {/* Expense Name */}
        <Form.Item
          label="Expense Name"
          name="name"
          rules={[{ required: true, message: "Please input the expense name!" }]}
        >
          <Input placeholder="Enter expense name" />
        </Form.Item>

        {/* Expense Amount */}
        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true, message: "Please input the amount!" }]}
        >
          <Input type="number" placeholder="Enter amount" prefix="₹" />
        </Form.Item>

        {/* Budget Category Dropdown */}
        <Form.Item
          label="Category"
          name="categoryId"
          rules={[{ required: true, message: "Please select a category!" }]}
        >
          <Select placeholder="Select budget category">
            {categories.map((category) => (
              <Select.Option key={category._id} value={category._id}>
                {category.icon + " " + category.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
            loading={loading} // Shows a loader on the button when submitting
          >
            {loading ? "Submitting..." : editData ? "Edit Expense" : "Add Expense"} {/* Dynamic Button Text */}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
