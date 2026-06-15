import type { Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
};

const sendResponse = <T>(res: Response, responseData: TResponse<T>) => {
  const responseBody: {
    success: boolean;
    message: string;
    data?: T;
  } = {
    success: responseData.success,
    message: responseData.message,
  };

  if (responseData.data !== undefined) {
    responseBody.data = responseData.data;
  }

  res.status(responseData.statusCode).json(responseBody);
};

export default sendResponse;
