-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: Citysolve360
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attachments`
--

DROP TABLE IF EXISTS `attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issue_id` int DEFAULT NULL,
  `comment_id` int DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `data` longblob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `issue_id` (`issue_id`),
  KEY `comment_id` (`comment_id`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attachments_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `issue_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_attachment_parent` CHECK ((((`issue_id` is not null) and (`comment_id` is null)) or ((`issue_id` is null) and (`comment_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachments`
--

LOCK TABLES `attachments` WRITE;
/*!40000 ALTER TABLE `attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citizens`
--

DROP TABLE IF EXISTS `citizens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citizens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address` text,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `citizens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citizens`
--

LOCK TABLES `citizens` WRITE;
/*!40000 ALTER TABLE `citizens` DISABLE KEYS */;
INSERT INTO `citizens` VALUES (1,3,'12 Maple Street','555-0101'),(2,4,'34 Oak Street','555-0102'),(3,5,'56 Pine Road','555-0103'),(4,6,'78 Cedar Lane','555-0104'),(5,7,'90 Spruce Avenue','555-0105');
/*!40000 ALTER TABLE `citizens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issue_categories`
--

DROP TABLE IF EXISTS `issue_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issue_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issue_categories`
--

LOCK TABLES `issue_categories` WRITE;
/*!40000 ALTER TABLE `issue_categories` DISABLE KEYS */;
INSERT INTO `issue_categories` VALUES (5,'Drainage Problems'),(3,'Garbage Collection'),(6,'Noise Complaint'),(10,'Others'),(7,'Parking Violation'),(8,'Public Safety'),(1,'Road Repair'),(4,'Street Light Issue'),(9,'Traffic Signal'),(2,'Water Leak');
/*!40000 ALTER TABLE `issue_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issue_comments`
--

DROP TABLE IF EXISTS `issue_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issue_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issue_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `issue_id` (`issue_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `issue_comments_ibfk_1` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `issue_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issue_comments`
--

LOCK TABLES `issue_comments` WRITE;
/*!40000 ALTER TABLE `issue_comments` DISABLE KEYS */;
INSERT INTO `issue_comments` VALUES (1,1,8,'Inspection scheduled for tomorrow.','2025-11-01 13:03:06'),(2,1,3,'Thank you for the update.','2025-11-01 13:03:06'),(3,2,9,'Repair team dispatched.','2025-11-01 13:03:06'),(4,3,1,'Issue has been escalated to higher official.','2025-11-01 13:03:06'),(5,4,10,'Problem resolved.','2025-11-01 13:03:06'),(6,5,8,'Rejected due to insufficient information.','2025-11-01 13:03:06'),(7,6,3,'Noise still ongoing in my area.','2025-11-01 13:03:06'),(8,7,4,'Parking issue cleared last week.','2025-11-01 13:03:06'),(9,8,9,'Guardrail replacement underway.','2025-11-01 13:03:06'),(10,9,6,'Traffic signals fixed last night.','2025-11-01 13:03:06');
/*!40000 ALTER TABLE `issue_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issues`
--

DROP TABLE IF EXISTS `issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('created','in progress','escalated','rejected','completed') DEFAULT 'created',
  `created_by` int NOT NULL,
  `updated_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `citizen_id` (`citizen_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `issues_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `citizens` (`id`) ON DELETE CASCADE,
  CONSTRAINT `issues_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `issues_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issues`
--

LOCK TABLES `issues` WRITE;
/*!40000 ALTER TABLE `issues` DISABLE KEYS */;
INSERT INTO `issues` VALUES (1,1,'Road Repair','Potholes on Maple Street','created',3,3,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(2,2,'Water Leak','Leakage near Oak Street','in progress',4,9,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(3,3,'Garbage Collection','Trash not emptied last week','escalated',5,1,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(4,4,'Street Light Issue','Flickering street light on Pine Road','completed',6,10,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(5,5,'Drainage Problems','Blocked drain at Cedar Lane','rejected',7,8,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(6,1,'Noise Complaint','Loud noise past midnight','created',3,3,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(7,2,'Parking Violation','Illegal parking on Spruce Avenue','created',4,4,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(8,3,'Public Safety','Broken guardrail near park','in progress',5,9,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(9,4,'Traffic Signal','Signal malfunction at 5th Ave','created',6,6,'2025-11-01 13:03:05','2025-11-01 13:03:05'),(10,5,'Others','Lost dog in neighborhood','created',7,7,'2025-11-01 13:03:05','2025-11-01 13:03:05');
/*!40000 ALTER TABLE `issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `officials`
--

DROP TABLE IF EXISTS `officials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `officials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `department` varchar(255) NOT NULL,
  `reports_to` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `reports_to` (`reports_to`),
  CONSTRAINT `officials_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `officials_ibfk_2` FOREIGN KEY (`reports_to`) REFERENCES `officials` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `officials`
--

LOCK TABLES `officials` WRITE;
/*!40000 ALTER TABLE `officials` DISABLE KEYS */;
/*!40000 ALTER TABLE `officials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('citizen','official','higherofficial') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Isabel HigherOfficial','isabel.higher@citysolve.com','hashedpwd9','higherofficial','2025-11-01 13:03:05','2025-11-01 13:03:05'),(2,'Jack HigherOfficial','jack.higher@citysolve.com','hashedpwd10','higherofficial','2025-11-01 13:03:05','2025-11-01 13:03:05'),(3,'Alice Citizen','alice1@example.com','hashedpwd1','citizen','2025-11-01 13:03:05','2025-11-01 13:03:05'),(4,'Bob Citizen','bob2@example.com','hashedpwd2','citizen','2025-11-01 13:03:05','2025-11-01 13:03:05'),(5,'Charlie Citizen','charlie3@example.com','hashedpwd3','citizen','2025-11-01 13:03:05','2025-11-01 13:03:05'),(6,'Diana Citizen','diana4@example.com','hashedpwd4','citizen','2025-11-01 13:03:05','2025-11-01 13:03:05'),(7,'Emily Citizen','emily5@example.com','hashedpwd5','citizen','2025-11-01 13:03:05','2025-11-01 13:03:05'),(8,'Frank Official','frank.official1@citysolve.com','hashedpwd6','official','2025-11-01 13:03:05','2025-11-01 13:03:05'),(9,'Grace Official','grace.official2@citysolve.com','hashedpwd7','official','2025-11-01 13:03:05','2025-11-01 13:03:05'),(10,'Henry Official','henry.official3@citysolve.com','hashedpwd8','official','2025-11-01 13:03:05','2025-11-01 13:03:05');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-06  2:54:56
