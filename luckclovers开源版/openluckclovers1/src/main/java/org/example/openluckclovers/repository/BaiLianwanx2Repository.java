package org.example.openluckclovers.repository;

import org.example.openluckclovers.config.BaiLianwanx2Config;
import org.springframework.data.jpa.repository.JpaRepository;

// JPA 仓库接口，用来操作数据库
public interface BaiLianwanx2Repository extends JpaRepository<BaiLianwanx2Config, Long> {
    // JpaRepository 自带了 save() 和 findById() 方法，不用自己写
}