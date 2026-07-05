from sqlalchemy import Column, Integer, String, Numeric, DateTime, Date, ForeignKey, Boolean, func
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    submissions = relationship("DailySubmission", back_populates="employee")

class DailySubmission(Base):
    __tablename__ = "daily_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    employee_name = Column(String, nullable=False)
    work_hours = Column(Numeric(5, 2), nullable=False)
    expenditure = Column(Numeric(10, 2), nullable=True)
    invoice_total = Column(Numeric(15, 2), nullable=True)
    submitted_at = Column(DateTime, default=func.now())
    submission_date = Column(Date, default=datetime.date.today)
    
    employee = relationship("Employee", back_populates="submissions")
    calculations = relationship("DailyCalculation", back_populates="submission")

class DailyCalculation(Base):
    __tablename__ = "daily_calculations"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("daily_submissions.id"), nullable=True)
    employee_name = Column(String, nullable=False)
    work_hours = Column(Numeric(5, 2), nullable=False)
    hourly_rate = Column(Integer, default=250)
    daily_pay = Column(Numeric(10, 2), nullable=False)
    expenditure = Column(Numeric(10, 2), nullable=True)
    invoice_total = Column(Numeric(15, 2), nullable=True)
    calculated_at = Column(DateTime, default=func.now())
    
    submission = relationship("DailySubmission", back_populates="calculations")
    reports = relationship("DailyReport", back_populates="calculation")

class DailyReport(Base):
    __tablename__ = "daily_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    calculation_id = Column(Integer, ForeignKey("daily_calculations.id"), nullable=True)
    employee_name = Column(String, nullable=True)
    pdf_path = Column(String, nullable=False)
    sent_to_boss = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    calculation = relationship("DailyCalculation", back_populates="reports")

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
